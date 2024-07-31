const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;

const { toBN, keccak256 } = require("web3-utils");

const {encodeFunctionSignature}  = require("web3-eth-abi")

require("dotenv").config();

const ProxyABI = require("../../../artifacts/contracts/stake/LockTOSv2Proxy.sol/LockTOSv2Proxy.json").abi
const LockTOSv2Logic1ABI = require("../../../artifacts/contracts/stake/LockTOSv2Logic1.sol/LockTOSv2Logic1.json").abi
const LockTOSv2Logic0ABI = require("../../../artifacts/contracts/stake/LockTOSv2Logic0.sol/LockTOSv2Logic0.json").abi

// sepolia
// const info = {
//   lockTosProxy: '0x8Fb966Bfb690a8304a5CdE54d9Ed6F7645b26576',
//   lockTosV2Logic: '0x4E8CAF927a3cBa9B19461dE81CE6932064fa2e6e',
//   maxTime : ethers.BigNumber.from('94348800'),
//   staker: '',
// }

// mainnet
const info = {
  lockTosProxy: '0x69b4a202fa4039b42ab23adb725aa7b1e9eebd79',
  lockTosV2Logic: '',
  maxTime : ethers.BigNumber.from('94348800'),
  staker: '',
}

async function needCheckpointCount() {
  const [deployer] = await ethers.getSigners();

  const locktos0 = await ethers.getContractAt(
    LockTOSv2Logic0ABI,
    info.lockTosProxy,
    deployer
  );

  const locktos1 = await ethers.getContractAt(
    LockTOSv2Logic1ABI,
    info.lockTosProxy,
    deployer
  );

  let count = await locktos1.needCheckpointCount()

  console.log('needCheckpointCount ', count)

  try {
    await (await locktos0.globalCheckpoint()).wait()
  } catch(e) {
    count = await locktos1.needCheckpointCount()
    count = count.div(ethers.constants.Two)
    await (await locktos1.globalCheckpoint(count)).wait()
  }

  count = await locktos1.needCheckpointCount()

  console.log('needCheckpointCount ', count)

  return null;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  await needCheckpointCount(deployer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
