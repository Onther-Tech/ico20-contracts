const { ethers } = require("hardhat");

require("dotenv").config();

async function deployMain() {
  const [deployer] = await ethers.getSigners();

  const LockTOSv2Proxy = await ethers.getContractFactory("LockTOSv2Proxy");

  let deployInfo = { name: "", address: "" };

  const lockTOSv2Proxy = await LockTOSv2Proxy.deploy();
  const tx = await lockTOSv2Proxy.deployed();
  console.log("LockTOSv2Proxy:", lockTOSv2Proxy.address);

  deployInfo = {
    name: "LockTOSv2Proxy",
    address: lockTOSv2Proxy.address,
  };

  console.log(deployInfo);

  const LockTOSProxy = await ethers.getContractFactory("LockTOSProxy");

  let deployInfo1 = { name: "", address: "" };

  const lockTOSProxy = await LockTOSProxy.deploy(
    lockTOSv2Proxy.address,
    deployer.address
  );
  const tx1 = await lockTOSProxy.deployed();
  console.log("LockTOSProxy:", lockTOSProxy.address);

  deployInfo1 = {
    name: "LockTOSProxy",
    address: lockTOSProxy.address,
  };

  console.log(deployInfo1);

  return null;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  await deployMain();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
