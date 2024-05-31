const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;

const { toBN, keccak256 } = require("web3-utils");

require("dotenv").config();

async function deployMain() {
  const [deployer] = await ethers.getSigners();

  const LockTOSv2Logic0 = await ethers.getContractFactory("LockTOSv2Logic0");

  let deployInfo = { name: "", address: "" };

  const lockTOSv2Logic0 = await LockTOSv2Logic0.deploy();
  const tx = await lockTOSv2Logic0.deployed();
  console.log("LockTOSv2Logic0:", lockTOSv2Logic0.address);

  deployInfo = {
    name: "LockTOSv2Logic0",
    address: lockTOSv2Logic0.address,
  };

  console.log(deployInfo);

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
