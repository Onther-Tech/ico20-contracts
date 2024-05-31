const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;

const {
  toBN,
  keccak256,
} = require("web3-utils");

require("dotenv").config();


async function deployMain() {
  const [deployer, user1] = await ethers.getSigners();

  const LockTOSDividend = await ethers.getContractFactory("LockTOSDividend");

  let deployInfo = {name:'', address:''};

  const lockTOSDividend = await LockTOSDividend.deploy();
  let tx  = await lockTOSDividend.deployed();
  console.log("LockTOSDividend:", lockTOSDividend.address);

  deployInfo = {
    name: "LockTOSDividend",
    address: lockTOSDividend.address
  }

  console.log(deployInfo);

  const LockTOSDividendProxy = await ethers.getContractFactory("LockTOSDividendProxy");

  let deployInfo1 = {name:'', address:''};

  const lockTOSDividendProxy = await LockTOSDividendProxy.deploy(
    lockTOSDividend.address, deployer.address
  );

  let tx1  = await lockTOSDividendProxy.deployed();
  console.log("LockTOSDividendProxy:", lockTOSDividendProxy.address);

  deployInfo1 = {
    name: "LockTOSDividendProxy",
    address: lockTOSDividendProxy.address
  }

  console.log(deployInfo1);

  return null;
}

async function main() {
  const [deployer, user1] = await ethers.getSigners();
  const users = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  contracts = await deployMain(deployer);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
