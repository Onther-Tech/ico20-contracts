const chai = require("chai");
const Web3EthAbi = require("web3-eth-abi");
require("chai").should();
const { expect } = require("chai");
const {
  keccak256,
} = require("web3-utils");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { Signer, Contract, ContractFactory } = require("ethers")
const LockTOSAbi = require("./abi/LockTOS.json")
const LockTOSProxyAbi = require("./abi/LockTOSProxy.json")
const TOSAbi = require("./abi/TOS.json")

let accounts, admin1,  user1, user2, user3, user4, provider;
let lockTOSLogic, lockTOSProxy, lockTOS, tosContract
let epochUnit,  maxTime;


// sepolia
let tosAddress = "0xff3ef745d9878afe5934ff0b130868afddbc58e8"
let tosAdminAddress = "0x757DE9c340c556b56f62eFaE859Da5e08BAAE7A2"
let lockTosProxyAddress = "0x8Fb966Bfb690a8304a5CdE54d9Ed6F7645b26576"


let tosAdmin
let startTime
let lockIds = []
// {account: , lockId: , value: , unlockTime }
// locakTOS 를 새로 포팅하고, 초기화 정보를 설정하고,
// 52 주 * 6년 = 312 주
// epochUnit 을 1시간으로 할 경우, 312 시간 : 13 일 정도의 시뮬레이션
// 테스트 아이디 10개..
// 매 10분 마다 deposit 하고, 20분, 40분마다 조회하고, 3년 뒤에 withdraw
// 13일 지났을때, 다시 조회가 되는지 확인한다.

// 새로 배포하자.
// 1. LockTOSProxy , LockTOS
//

function findAccount(accountAddress)
{
  let curAccount = user1
  if (user1.address == accountAddress)  curAccount = user1;
  else if (user2.address == accountAddress)  curAccount = user2;
  else if (user3.address == accountAddress)  curAccount = user3;
  else if (user4.address == accountAddress)  curAccount = user4;

  return curAccount
}

function decimalToHexString(number)
{
    if (number < 0)  number = 0xFFFFFFFF + number + 1;
    return number.toString(16).toUpperCase();
}

async function deployContract(
  abi,
  bytecode,
  deployParams,
  actor )
{
  const factory = new ContractFactory(abi, bytecode, actor);
  return await factory.deploy(...deployParams);
}

async function allowance(
  contract,
  from,
  to,
  amount )
{
  const allowanceAmount = await contract.allowance(from.address, to.address);

  if(allowanceAmount.lt(amount)) {
    await (await contract.connect(from).approve(to.address, amount)).wait()
  }
}

async function createLock (user, amount) {
  const maxTime_ = await lockTOS.maxTime()
  const epochUnit_ = await lockTOS.epochUnit()
  const unlockWeeks = maxTime_.div(epochUnit_)

  await allowance(tosContract, user, lockTOS, amount)
  let startProcess = Date.now()
  const receipt = await (await lockTOS.connect(user).createLock(amount, unlockWeeks)).wait()
  console.log('createLock process :', (Date.now()) - startProcess)
  const topic = lockTOS.interface.getEventTopic('LockCreated');
  const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
  const deployedEvent = lockTOS.interface.parseLog(log);

  lockIds.push(
    {
      account: deployedEvent.args.account,
      lockId: deployedEvent.args.lockId,
      value: deployedEvent.args.value,
      unlockTime: deployedEvent.args.unlockTime
    }
  )
}

async function depositFor (index, amount) {
  let curLockId = lockIds[index]
  let curAccount = findAccount(curLockId.account)
  let info = await lockTOS.locksInfo(curLockId.lockId)
  let block1 = await ethers.provider.getBlock('latest')
  expect(info.end.toNumber()).to.be.gte(block1.timestamp)

  await allowance(tosContract, curAccount, lockTOS, amount)
  let startProcess = Date.now()
  const receipt = await (await lockTOS.connect(curAccount).depositFor(
    curLockId.account,
    curLockId.lockId,
    amount)
  ).wait()
  console.log('depositFor process :', (Date.now()) - startProcess)
  const topic = lockTOS.interface.getEventTopic('LockDeposited');
  const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
  const deployedEvent = lockTOS.interface.parseLog(log);
  lockIds[index].value = curLockId.value.add(deployedEvent.args.value)
}

async function increaseUnlockTime(index) {
    let curLockId = lockIds[index]
    let curAccount = findAccount(curLockId.account)
    let info = await lockTOS.locksInfo(curLockId.lockId)
    let block1 = await ethers.provider.getBlock('latest')
    expect(info.end.toNumber()).to.be.gte(block1.timestamp)

    let _unlockWeeks = (maxTime - (info.end.toNumber() - block1.timestamp)) / epochUnit
    _unlockWeeks = parseInt(_unlockWeeks)

    let startProcess = Date.now()
    const receipt = await (await lockTOS.connect(curAccount).increaseUnlockTime(
      curLockId.lockId,
      _unlockWeeks)
    ).wait()

    console.log('increaseUnlockTime process :', (Date.now()) - startProcess)
    // const topic = lockTOS.interface.getEventTopic('LockUnlockTimeIncreased');
    // const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
    // const deployedEvent = lockTOS.interface.parseLog(log);
}

async function passTime (periodTime) {
  // let block = await ethers.provider.getBlock('latest')
  // let periodTime = 60*60*24
  let blockLen = periodTime / 12
  let hexLen = "0x"+decimalToHexString(blockLen);

  await ethers.provider.send("evm_increaseTime", [periodTime])
  await hre.network.provider.send("hardhat_mine", [hexLen]);
  let block1 = await ethers.provider.getBlock('latest')
  let epochCounts = (block1.timestamp - startTime) /  epochUnit

  console.log('epochCounts', epochCounts)
  console.log('maxCounts', maxTime / epochUnit)
}

describe("LockTOS Test", function () {

  before(async () => {
    accounts = await ethers.getSigners();
    // console.log(accounts)
    [admin1, user1, user2, user3, user4] = accounts;
    provider = ethers.provider;
    await provider.get
    epochUnit = 3600 // 1시간  //604800
    maxTime = 561600 //  3600*52*3  156 시간 // 94348800  94348800
    await hre.ethers.provider.send("hardhat_impersonateAccount", [
      tosAdminAddress,
    ]);

    tosAdmin = await ethers.getSigner(tosAdminAddress);
    await hre.ethers.provider.send("hardhat_setBalance", [
      tosAdminAddress,
      "0x4EE2D6D415B85ACEF8100000000",
    ]);

  });

  describe(" contract  ", () => {
    it("lockTOS Contract ", async () => {

      lockTOSProxy = await ethers.getContractAt(
        LockTOSProxyAbi.abi,
        lockTosProxyAddress,
        admin1
      );

      lockTOS = await ethers.getContractAt(
        LockTOSAbi.abi,
        lockTosProxyAddress,
        admin1
      );

    });

    it("tosContract ", async () => {
      tosContract = await ethers.getContractAt(TOSAbi.abi, tosAddress, admin1);
      console.log('tosContract', tosContract.address)
    });

  })

  describe(" TOS mint ", () => {

    it("addMinter ", async () => {
      await (await tosContract.connect(tosAdmin).addMinter(admin1.address)).wait();
    });

    it("mint ", async () => {
      let amount = ethers.utils.parseEther("10000")
      await (await tosContract.connect(admin1).mint(user1.address, amount)).wait();
      await (await tosContract.connect(admin1).mint(user2.address, amount)).wait();
      await (await tosContract.connect(admin1).mint(user3.address, amount)).wait();
      await (await tosContract.connect(admin1).mint(user4.address, amount)).wait();

    });

  })

  // describe(" deposit lockTOS ", () => {

  //   it("lockTOS ", async () => {
  //     lockTOS = await ethers.getContractAt(LockTOSAbi.abi, lockTOSProxy.address, admin1);
  //   });

  //   it("createLock : 1", async () => {
  //     let block1 = await ethers.provider.getBlock('latest')
  //     startTime = block1.timestamp

  //     const amount = ethers.utils.parseEther("100")
  //     await createLock (user1, amount)

  //   });

  //   it("createLock : 2 ", async () => {
  //     const amount = ethers.utils.parseEther("100")
  //     await createLock (user2, amount)
  //   });

  //   it("createLock : 3 ", async () => {
  //     const amount = ethers.utils.parseEther("100")
  //     await createLock (user3, amount)
  //   });

  //   it("createLock : 4 ", async () => {
  //     const amount = ethers.utils.parseEther("100")
  //     await createLock (user4, amount)
  //   });

  //   it("      pass time : 1 day ", async function () {
  //       let periodTime = 60*60*24
  //       await passTime (periodTime)
  //   })

  //   it("depositFor : 1", async () => {
  //     let index = 0
  //     const amount = ethers.utils.parseEther("50")
  //     await depositFor (index, amount)
  //   });

  //   it("createLock : 1", async () => {
  //     const amount = ethers.utils.parseEther("10")
  //     await createLock (user1, amount)
  //   });

  //   it("      pass time : 1 day ", async function () {

  //     let periodTime = 60*60*24
  //     await passTime (periodTime)
  //   })

  //   it("depositFor : 2", async () => {
  //     let index = 1
  //     const amount = ethers.utils.parseEther("100")

  //     await depositFor (index, amount)

  //   });

  //   it("createLock : 3", async () => {
  //     const amount = ethers.utils.parseEther("100")
  //     await createLock (user2, amount)
  //   });

  //   it("      pass time : 1 day ", async function () {

  //     let periodTime = 60*60*24
  //     await passTime (periodTime)
  //   })

  //   it("depositFor : 3 ", async () => {
  //     let index = 2
  //     const amount = ethers.utils.parseEther("100")
  //     await depositFor (index, amount)

  //   });

  //   it("depositFor : 4 ", async () => {
  //     let index = 3
  //     const amount = ethers.utils.parseEther("100")
  //     await depositFor (index, amount)


  //   });

  //   it("      pass time : 1 day ", async function () {

  //     let periodTime = 60*60*24
  //     await passTime (periodTime)
  //   })

  //   it("increaseUnlockTime : 1 ", async () => {
  //     let index = 0
  //     await increaseUnlockTime(index)
  //   });


  //   it("increaseUnlockTime : 2 ", async () => {
  //     let index = 1
  //     await increaseUnlockTime(index)

  //   });

  //   it("increaseUnlockTime : 3 ", async () => {
  //     let index = 2
  //     await increaseUnlockTime(index)

  //   });

  //   it("      pass time : 1 day ", async function () {

  //     let periodTime = 60*60*24
  //     await passTime (periodTime)
  //   })

  //   it("depositFor : 1", async () => {
  //     let index = 0
  //     const amount = ethers.utils.parseEther("100")
  //     await depositFor (index, amount)

  //   });

  //   it("createLock : 1", async () => {
  //     const amount = ethers.utils.parseEther("200")
  //     await createLock (user1, amount)
  //   });

  //   it("      pass time : 1 day ", async function () {
  //     let periodTime = 60*60*24
  //     await passTime (periodTime)
  //   })

  //   it("createLock : 2", async () => {
  //     const amount = ethers.utils.parseEther("200")
  //     await createLock (user2, amount)
  //   });

  //   it("createLock : 3", async () => {
  //     const amount = ethers.utils.parseEther("200")
  //     await createLock (user3, amount)
  //   });

  //   it("depositFor : 1", async () => {
  //     let index = 0
  //     const amount = ethers.utils.parseEther("100")
  //     await depositFor (index, amount)
  //   });

  //   it("      pass time : 1 day ", async function () {
  //     let periodTime = 60*60*24
  //     await passTime (periodTime)
  //   })

  //   it("depositFor : 2", async () => {
  //     let index = 1
  //     const amount = ethers.utils.parseEther("100")
  //     await depositFor (index, amount)
  //   });

  //   it("increaseUnlockTime : 2 ", async () => {
  //     let index = 1
  //     await increaseUnlockTime(index)

  //   });

  //   it("      pass time : 2 day ** ", async function () {
  //     let periodTime = 60*60*24*2
  //     await passTime (periodTime)
  //   })

  //   it("depositFor : 2", async () => {
  //     let index = 1
  //     const amount = ethers.utils.parseEther("100")
  //     await depositFor (index, amount)
  //   });
  //   it("increaseUnlockTime : 2 ", async () => {
  //     let index = 1
  //     await increaseUnlockTime(index)

  //   });

  //   it("increaseUnlockTime : 3 ", async () => {
  //     let index = 2
  //     await increaseUnlockTime(index)

  //   });

  //   it("      pass time : 5 day ", async function () {
  //     let periodTime = 60*60*24*5
  //     await passTime (periodTime)
  //   })

  //   it("increaseUnlockTime : 3 ", async () => {
  //     let index = 2
  //     await increaseUnlockTime(index)

  //   });

  //   it("createLock : 1", async () => {
  //     const amount = ethers.utils.parseEther("200")
  //     await createLock (user1, amount)
  //   });

  //   it("      pass time : 5 day ", async function () {
  //     let periodTime = 60*60*24*5
  //     await passTime (periodTime)
  //   })

  //   it("createLock : 1", async () => {
  //     const amount = ethers.utils.parseEther("200")
  //     await createLock (user1, amount)
  //   });

  //   // it("increaseUnlockTime : 3 ", async () => {
  //   //   let index = lockIds.length-1
  //   //   await increaseUnlockTime(index)
  //   // });

  // });

})
