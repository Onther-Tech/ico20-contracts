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
const LockTOSAbi = require("../../abis/LockTOSv2Logic.json")
const LockTOSProxyAbi = require("../../abis/LockTOSv2Proxy.json")
const TOSAbi = require("../../abis/TOS.json")
const LockTOSv2Logic1Abi = require("../../abis/LockTOSv2Logic1.json")

const {encodeFunctionSignature}  = require("web3-eth-abi")

const ProxyABI = require("../../artifacts/contracts/stake/LockTOSv2Proxy.sol/LockTOSv2Proxy.json").abi

let accounts, admin1,  user1, user2, user3, user4, provider;
let lockTOSLogic, lockTOSProxy, lockTOS, tosContract, lockTOSLogicV1
let epochUnit,  maxTime;


// sepolia
let tosAddress = "0xff3ef745d9878afe5934ff0b130868afddbc58e8"
let tosAdminAddress = "0x757DE9c340c556b56f62eFaE859Da5e08BAAE7A2"
let lockTosProxyAddress = "0x8Fb966Bfb690a8304a5CdE54d9Ed6F7645b26576"


let tosAdmin
let startTime

async function deployContract(
  abi,
  bytecode,
  deployParams,
  actor )
{
  const factory = new ContractFactory(abi, bytecode, actor);
  return await factory.deploy(...deployParams);
}

function decimalToHexString(number)
{
    if (number < 0)  number = 0xFFFFFFFF + number + 1;
    return number.toString(16).toUpperCase();
}

async function passTime (periodTime) {
  let block = await ethers.provider.getBlock('latest')
  let startTime = block.timestamp
  // let periodTime = 60*60*24
  let blockLen = periodTime / 12
  let hexLen = "0x"+decimalToHexString(blockLen);

  let epochUnit = await lockTOS.epochUnit()
  epochUnit = epochUnit.toNumber()
  // console.log('epochUnit', epochUnit)

  await ethers.provider.send("evm_increaseTime", [periodTime])
  await hre.network.provider.send("hardhat_mine", [hexLen]);
  let block1 = await ethers.provider.getBlock('latest')
  let epochCounts = (block1.timestamp - startTime) /  epochUnit

  // console.log('epochCounts', epochCounts)
  // console.log('maxCounts', maxTime / epochUnit)
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

  //   it("add functions ", async () => {
  //     lockTOSLogicV1 = await deployContract(LockTOSv2Logic1Abi.abi, LockTOSv2Logic1Abi.bytecode, [], admin1);
  //     console.log('lockTOSLogicV1', lockTOSLogicV1.address)

  //     const index = 1
  //     await (await lockTOSProxy.connect(admin1).setImplementation2(lockTOSLogicV1.address, index, true)).wait()

  //     const logic0 = await lockTOSProxy.implementation2(index)
  //     console.log('logic1', logic0)

  //     // selector1 0xab2f5917
  //     // selector2 0x8ea0b211
  //     const selector1 = encodeFunctionSignature("globalCheckpoint(uint256)");
  //     const selector2 = encodeFunctionSignature("needCheckpointCount()");

  //     console.log('selector1', selector1)
  //     console.log('selector2', selector2)

  //     await (await lockTOSProxy.connect(admin1).setSelectorImplementations2([selector1, selector2], lockTOSLogicV1.address)).wait()
  //     const funcImp1  = await lockTOSProxy.selectorImplementation(selector1)
  //     const funcImp2  = await lockTOSProxy.selectorImplementation(selector2)

  //     console.log('globalCheckpoint funcImp', funcImp1)
  //     console.log('needCheckpointCount funcImp', funcImp2)

  //  });

    // it("tosContract ", async () => {
    //   tosContract = await ethers.getContractAt(TOSAbi.abi, tosAddress, admin1);
    //   console.log('tosContract', tosContract.address)
    // });

  })

  // describe(" TOS mint ", () => {

  //   it("addMinter ", async () => {
  //     await (await tosContract.connect(tosAdmin).addMinter(admin1.address)).wait();
  //   });

  //   it("mint ", async () => {
  //     let amount = ethers.utils.parseEther("10000")

  //     await (await tosContract.connect(admin1).mint(user1.address, amount)).wait();
  //     await (await tosContract.connect(admin1).mint(user2.address, amount)).wait();
  //     await (await tosContract.connect(admin1).mint(user3.address, amount)).wait();
  //     await (await tosContract.connect(admin1).mint(user4.address, amount)).wait();

  //   });

  // })

  describe(" lockTOS ", () => {

    it("globalCheckpoint(uint256) : 1 week ", async () => {

      const needCheckpointCount = await lockTOS.connect(admin1)["needCheckpointCount()"]()
      console.log('needCheckpointCount :', needCheckpointCount)

      const needCheckpointPrev = await lockTOS.needCheckpoint()
      console.log('needCheckpoint Prev :', needCheckpointPrev)

      const receipt = await (await lockTOS.connect(admin1)["globalCheckpoint(uint256)"](1)).wait()

      const needCheckpointAfter = await lockTOS.needCheckpoint()
      console.log('needCheckpoint After :', needCheckpointAfter)

      const needCheckpointCountAfter  = await lockTOS.connect(admin1)["needCheckpointCount()"]()
      console.log('needCheckpointCount After:', needCheckpointCountAfter)


    });

    it("globalCheckpoint(uint256) : 10 weeks ", async () => {
      const needCheckpointCount = await lockTOS.connect(admin1)["needCheckpointCount()"]()
      console.log('needCheckpointCount :', needCheckpointCount)

      const needCheckpointPrev = await lockTOS.needCheckpoint()
      console.log('needCheckpoint Prev :', needCheckpointPrev)

      const receipt = await (await lockTOS.connect(admin1)["globalCheckpoint(uint256)"](10)).wait()

      const needCheckpointAfter = await lockTOS.needCheckpoint()
      console.log('needCheckpoint After :', needCheckpointAfter)

      const needCheckpointCountAfter  = await lockTOS.connect(admin1)["needCheckpointCount()"]()
      console.log('needCheckpointCount After:', needCheckpointCountAfter)

    });

    it("      pass time : 60 days ", async function () {
      let periodTime = 60*60*24*60
      await passTime (periodTime)
    })

    it("globalCheckpoint() ", async () => {

      const needCheckpointCount = await lockTOS.connect(admin1)["needCheckpointCount()"]()
      console.log('needCheckpointCount :', needCheckpointCount)

      const needCheckpointPrev = await lockTOS.needCheckpoint()
      console.log('needCheckpoint Prev :', needCheckpointPrev)

      const receipt = await (await lockTOS.connect(admin1)["globalCheckpoint()"]()).wait()

      const needCheckpointAfter = await lockTOS.needCheckpoint()
      console.log('needCheckpoint After :', needCheckpointAfter)

      const needCheckpointCountAfter = await lockTOS.connect(admin1)["needCheckpointCount()"]()
      console.log('needCheckpointCount After :', needCheckpointCountAfter)

    });

  });

})
