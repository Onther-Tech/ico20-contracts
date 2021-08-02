/* eslint-disable no-undef */
const chai = require("chai");
const { expect } = require("chai");

const { solidity } = require("ethereum-waffle");
chai.use(solidity);

const { time } = require("@openzeppelin/test-helpers");
const { toBN, toWei, keccak256, fromWei } = require("web3-utils");

const {
  getAddresses,
  findSigner,
  setupContracts,
  mineBlocks,
} = require("./utils");
const { ethers, network } = require("hardhat");

describe("LockTOS", function () {
  let admin, user, user2;
  let tos;
  let lockTOS;
  let phase3StartTime;
  const userLockInfo = [];
  const MAXTIME = 94608000;
  const tosAmount = 1000000000;

  // Helper functions
  const findClosestPoint = (history, timestamp) => {
    if (history.length === 0) {
      return null;
    }
    let left = 0;
    let right = history.length;
    while (left + 1 < right) {
      const mid = Math.floor((left + right) / 2);
      if (history[mid].timestamp <= _timestamp) left = mid;
      else right = mid;
    }
    return history[left];
  };

  const calculateBalanceOfLock = async (user, lockId, timestamp) => {
    const userHistory = await lockTOS.pointHistoryOf(user.address, lockId);
    const foundPoint = await findClosestPoint(userHistory, timestamp);
    if (foundPoint == null) return 0;
    const currentBias = foundPoint.slope * (timestamp - foundPoint.timestamp);
    let boostValue = 1;
    if (timestamp < phase3StartTime) {
      boostValue = 2;
    }
    const MULTIPLIER = Math.pow(10, 18);
    return Math.floor(
      ((foundPoint.bias > currentBias ? foundPoint.bias - currentBias : 0) *
        boostValue) /
        MULTIPLIER
    );
  };

  const calculateBalanceOfUser = async (user, timestamp) => {
    const locks = await lockTOS.locksOf(user.address);
    let accBalance = 0;
    for (const lockId of locks) {
      accBalance += await calculateBalanceOfLock(user, lockId, timestamp);
    }
    return accBalance;
  };

  before(async () => {
    const addresses = await getAddresses();
    admin = await findSigner(addresses[0]);
    user = await findSigner(addresses[1]);
  });

  it("Initialize contracts", async function () {
    this.timeout(1000000);
    ({ tos } = await setupContracts(admin.address));
  });

  it("Deploy LockTOS", async function () {
    phase3StartTime = (await time.latest()) + time.duration.weeks(10);
    lockTOS = await (
      await ethers.getContractFactory("LockTOS")
    ).deploy(tos.address, phase3StartTime);
    await lockTOS.deployed();
  });

  it("mint TOS to users", async function () {
    await (await tos.connect(admin).mint(user.address, tosAmount)).wait();
    expect(await tos.balanceOf(user.address)).to.be.equal(tosAmount);
  });

  const approve = async (user, amount) => {
    await (await tos.connect(user).approve(lockTOS.address, amount)).wait();
  };

  const createLock = async (user, amount, unlockTime) => {
    await (await lockTOS.connect(user).createLock(amount, unlockTime)).wait();
  };

  const createLockPermit = async (user, amount, unlockTime) => {
    const nonce = parseInt(await tos.nonces(user.address));
    const deadline = parseInt(await time.latest()) + 20;
    const chainId = parseInt(await network.provider.send("eth_chainId")); // 31337 await ethers.Provider.getNetwork().chainId;
    const hashPermit = await tos.hashPermit(
      user.address,
      lockTOS.address,
      amount,
      deadline,
      nonce
    );

    console.log({ hashPermit });
    const domain = {
      chainId,
      name: "TOS",
      version: "1",
      verifyingContract: tos.address,
    };

    const types = {
      Message: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      owner: user.address,
      spender: lockTOS.address,
      value: amount,
      nonce,
      deadline,
    };

    const signature = (
      await user._signTypedData(domain, types, message)
    ).substring(2);

    const r = "0x" + signature.substring(0, 64);
    const s = "0x" + signature.substring(64, 128);
    const v = parseInt(signature.substring(128, 130), 16);

    await (
      await lockTOS
        .connect(user)
        .createLockPermit(amount, unlockTime, deadline, v, r, s)
    ).wait();
    console.log("done");
  };

  const generateCreateProcess = async ({
    user,
    lockedAmount,
    lockedDuration,
  }) => {
    const startTime = parseInt(await time.latest());
    const endTime = startTime + lockedDuration;
    const slope = lockedAmount / MAXTIME;
    const bias = slope * lockedDuration;
    await approve(user, lockedAmount);
    await createLock(user, lockedAmount, endTime);
    // await createLockPermit(user, lockedAmount, endTime);
    return { startTime, endTime, lockedAmount, bias, slope };
  };

  it("should create locks for user", async function () {
    userLockInfo.push(
      await generateCreateProcess({
        user,
        lockedAmount: 300000000,
        lockedDuration: parseInt(time.duration.weeks(20)),
        increase: [{ amount: 20000, after: time.duration.weeks(1) }],
      })
    );
    userLockInfo.push(
      await generateCreateProcess({
        user,
        lockedAmount: 300000000,
        lockedDuration: parseInt(time.duration.weeks(5)),
        increase: [{ amount: 10000, after: time.duration.weeks(1) }],
      })
    );
    userLockInfo.push(
      await generateCreateProcess({
        user,
        lockedAmount: 200000000,
        lockedDuration: parseInt(time.duration.years(3)),
        increase: [{ amount: 10000, after: time.duration.weeks(1) }],
      })
    );
    userLockInfo.push(
      await generateCreateProcess({
        user,
        lockedAmount: 100000000,
        lockedDuration: parseInt(time.duration.days(8)),
        increase: null,
      })
    );
  });

  it("should check balances now of ", async function () {
    const totalBalance = parseInt(await lockTOS.balanceOf(user.address));
    const estimatedTotalBalance = parseInt(
      await calculateBalanceOfUser(user, parseInt(await time.latest()))
    );
    expect(totalBalance).to.equal(estimatedTotalBalance)

    const locksOf = await lockTOS.locksOf(user.address);
    for (let i = 0; i < locksOf.length; ++i) {
      userLockInfo[i].lockId = locksOf[i];
    }

    for (const info of userLockInfo) {
      const currentTime = parseInt(await time.latest());
      const { lockId } = info;
      const balance = parseInt(
        await lockTOS.balanceOfLock(user.address, lockId)
      );
      const estimate = await calculateBalanceOfLock(user, lockId, currentTime);
      expect(balance).to.equal(estimate);
    }
  });

  it("should check history changes", async function () {
    const changes = [];
    for (let it = 0; it < 10; ++it) {
      await time.increase(time.duration.weeks(1));
      for (const info of userLockInfo) {
        const { lockId } = info;
        const currentTime = parseInt(await time.latest());
        const lockBalance = (
          await lockTOS.balanceOfLock(user.address, lockId)
        ).toString();
        changes.push({
          lockId,
          captureBalance: lockBalance,
          captureTimestamp: currentTime,
        });
      }
    }

    for (const change of changes) {
      const { lockId, captureTimestamp, captureBalance } = change;
      const lockBalance = (
        await lockTOS.balanceOfLockAt(user.address, lockId, captureTimestamp)
      ).toString();
      expect(lockBalance).to.be.equal(captureBalance);

      // const tosStaked = await lockTOS.lockedBalances(user.address, lockId);
      // console.log({ tosStaked });
    }
  });

  it("should check total supply now", async function () {
    const totalSupply = await lockTOS.totalSupply();
    console.log("Total supply: ", totalSupply.toString());
  });

  it("should change time and check vote weights", async function () {
    for (const info of userLockInfo) {
      const { lockId } = info;
      const lockBalance = await lockTOS.balanceOfLock(user.address, lockId);
      await time.increaseTo();

      console.log(`Vote Weight: ${lockBalance.toString()}, LockId: ${lockId}`);
    }
  });

  it("should withdraw for user", async function () {
    let accTos = 0;
    for (const info of userLockInfo) {
      const { lockId, lockedAmount } = info;
      accTos += lockedAmount;
      await (await lockTOS.withdraw(lockId)).wait();
      expect(await lockTOS.balanceOf(user.address)).to.be.equal(accTos);
    }
  });
});