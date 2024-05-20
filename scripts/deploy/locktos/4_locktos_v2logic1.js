const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;

const {
  toBN,
  keccak256,
} = require("web3-utils");

require("dotenv").config();


async function deployMain(defaultSender) {
  const [deployer, user1] = await ethers.getSigners();

  const LockTOSv2Logic1 = await ethers.getContractFactory("LockTOSv2Logic1");

  let deployInfo = {name:'', address:''};

  const lockTOSv2Logic1 = await LockTOSv2Logic1.deploy();
  let tx  = await lockTOSv2Logic1.deployed();
  console.log("LockTOSv2Logic1:", lockTOSv2Logic1.address);

  deployInfo = {
    name: "LockTOSv2Logic1",
    address: lockTOSv2Logic1.address
  }

  console.log(deployInfo);

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
