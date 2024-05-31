const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;

const { toBN, keccak256 } = require("web3-utils");

require("dotenv").config();

const ProxyABI = require("../../../artifacts/contracts/stake/LockTOSv2Proxy.sol/LockTOSv2Proxy.json").abi

const LogicABI = require("../../../artifacts/contracts/stake/LockTOSv2Logic0.sol/LockTOSv2Logic0.json").abi

const info = {
  lockTosProxy: '0x8Fb966Bfb690a8304a5CdE54d9Ed6F7645b26576',
  lockTosV2Logic: '0xb6564de6BEf2c539D6560B279DcCcD6edbe7a985',
  maxTime : ethers.BigNumber.from('94348800'),
  staker: '0xcdcf05675332ef56B44E437aad4dd71237c89496',
}

async function deployMain() {
  const [deployer] = await ethers.getSigners();

  const lockTos = await ethers.getContractAt(
    LogicABI,
    info.lockTosProxy,
    deployer
  );

  await (await lockTos.setStaker(info.staker)).wait()

  staker = await lockTos.staker()
  console.log('staker', staker)

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
