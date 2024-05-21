const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;

const { toBN, keccak256 } = require("web3-utils");

const {encodeFunctionSignature}  = require("web3-eth-abi")

require("dotenv").config();

const ProxyABI = require("../../../artifacts/contracts/stake/LockTOSv2Proxy.sol/LockTOSv2Proxy.json").abi

const info = {
  lockTosProxy: '0x8Fb966Bfb690a8304a5CdE54d9Ed6F7645b26576',
  lockTosV2Logic: '0x1667934506bDeF259014Ea75a7Fa425AEaC56AcB',
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

  // 0xab2f5917
  const selector1 = encodeFunctionSignature("globalCheckpoint(uint256)");
  console.log('selector1', selector1)

  // await (await proxy.setSelectorImplementations2([selector1], logic0)).wait()
  const funcImp  = await proxy.selectorImplementation(selector1)
  console.log('funcImp', funcImp)

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
