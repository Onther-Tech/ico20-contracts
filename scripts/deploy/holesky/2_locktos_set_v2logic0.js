const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;

const { toBN, keccak256 } = require("web3-utils");

require("dotenv").config();

const ProxyABI = require("../../../artifacts/contracts/stake/LockTOSv2Proxy.sol/LockTOSv2Proxy.json").abi

const info = {
  lockTosProxy: '0x8Fb966Bfb690a8304a5CdE54d9Ed6F7645b26576',
  lockTosV2Logic: '0xb6564de6BEf2c539D6560B279DcCcD6edbe7a985',
  maxTime : ethers.BigNumber.from('0'),
  staker: '',
}

async function deployMain() {
  const [deployer] = await ethers.getSigners();

  const proxy = await ethers.getContractAt(
    ProxyABI,
    info.lockTosProxy,
    deployer
  );

  await (await proxy.setImplementation2(info.lockTosV2Logic, 0, true)).wait()

  // let logic0 = await proxy.implementation()
  // console.log('logic0', logic0)

  logic0 = await proxy.implementation2(0)
  console.log('logic0', logic0)

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
