const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const utils = ethers.utils;
const save = require("./save_deployed_file");

const {
  padLeft,
  toBN,
  toWei,
  fromWei,
  keccak256,
  soliditySha3,
  solidityKeccak256,
} = require("web3-utils");

require("dotenv").config();
const loadDeployedInitVariable = require("./load_deployed_init");

const initialTotal = process.env.initialTotal + "." + "0".repeat(18);

const zeroAddress = "0x0000000000000000000000000000000000000000";
const sendAmountForTest = "10000";

const ADMIN_ROLE = keccak256("ADMIN");
//const PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
const PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
const EIP712Domain =  keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

async function deployTOS(name, symbol, version) {
  const [deployer, user1] = await ethers.getSigners();

  const TOS = await ethers.getContractFactory("TOS");
  const tos = await TOS.deploy(name, symbol, version);
  await tos.deployed();
  console.log('tos',tos.address);

  // await tos.grantRole(MINTER_ROLE, deployer.address);
  await tos.mint(deployer.address, utils.parseUnits(initialTotal, 18));
  console.log("tos mint to:", deployer.address);

  return tos.address;
}

async function main() {
  const [deployer, user1] = await ethers.getSigners();
  const users = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("ADMIN_ROLE:", ADMIN_ROLE );
  console.log("PERMIT_TYPEHASH:", PERMIT_TYPEHASH );
  console.log("EIP712Domain:", EIP712Domain );

  let name = "TON Starter";
  let symbol = "TOS";
  let version = "1";

  const contracts = await deployTOS(name, symbol, version);
  console.log("TOS address:", process.env.NETWORK, contracts);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });