const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;

const { toBN, keccak256 } = require("web3-utils");

const {encodeFunctionSignature}  = require("web3-eth-abi")

require("dotenv").config();

const ProxyABI = require("../../../artifacts/contracts/stake/LockTOSv2Proxy.sol/LockTOSv2Proxy.json").abi

const info = {
  lockTosProxy: '0x8Fb966Bfb690a8304a5CdE54d9Ed6F7645b26576',
  lockTosV2Logic: '0x4E8CAF927a3cBa9B19461dE81CE6932064fa2e6e',
  maxTime : ethers.BigNumber.from('94348800'),
  staker: '',
}

async function deployMain() {
  const [deployer] = await ethers.getSigners();

  const proxy = await ethers.getContractAt(
    ProxyABI,
    info.lockTosProxy,
    deployer
  );

  const index = 1
  await (await proxy.setImplementation2(info.lockTosV2Logic, index, true)).wait()

  logic0 = await proxy.implementation2(index)
  console.log('logic1', logic0)

  // selector1 0xab2f5917
  // selector2 0x8ea0b211
  const selector1 = encodeFunctionSignature("globalCheckpoint(uint256)");
  const selector2 = encodeFunctionSignature("needCheckpointCount()");

  console.log('selector1', selector1)
  console.log('selector2', selector2)

  await (await proxy.setSelectorImplementations2([selector1, selector2], logic0)).wait()
  const funcImp1  = await proxy.selectorImplementation(selector1)
  const funcImp2  = await proxy.selectorImplementation(selector2)

  console.log('globalCheckpoint funcImp', funcImp1)
  console.log('needCheckpointCount funcImp', funcImp2)

  return null;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  await deployMain(deployer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
