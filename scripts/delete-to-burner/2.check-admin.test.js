const { ethers, upgrades } = require("hardhat");

const StakeSimpleABI = require("../../abis/StakeSimple.json").abi;
const Erc20ABI = require("../../abis/erc20ABI.json");
const SeigManagerABI = require("../../abis/SeigManager.json").abi;
const DepositManagerABI = require("../../abis/DepositManager.json").abi;


const stakeContract1 = "0x9a8294566960Ab244d78D266FFe0f284cDf728F1";
const stakeContract2 = "0x7da4E8Ab0bB29a6772b6231b01ea372994c2A49A";
const stakeContract3 = "0xFC1fC3a05EcdF6B3845391aB5CF6a75aeDef7CeA";
const stakeContract4 = "0x9F97b34161686d60ADB955ed63A2FC0b2eC0a2a9";
const stakeContract5 = "0x21Db1777Dd95749A849d9e244136E72bd93082Ea";

const TON = "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5";
const WTON = "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2";
const TOS = "0x409c4D8cd5d2924b9bc5509230d16a61289c8153";

const Layer2 = "0x42ccf0769e87cb2952634f607df1c7d62e0bbc52";

const SeigManager = "0x710936500aC59e8551331871Cbad3D33d5e0D909";
const DepositManager = "0x56e465f654393fa48f007ed7346105c7195cee43";
const Vault = "0xf04f6a6d6115d8400d18eca99bdee67abb498a7b";

let stakers = [];

let stakeInfos = []

async function main() {

    await getData(stakeContract1);

}

async function getData(contractAddress) {
    const contract = await ethers.getContractAt(StakeSimpleABI, contractAddress, ethers.provider);

    let block = await ethers.provider.getBlock('latest')

    let startBlock = 12880649;
    let endBlock = 12991362;

    let allEvents = [];

    let eventFilter = [
        contract.filters.Staked(null, null)
        ];
    let txCount = 0;
    for(let i = startBlock; i < endBlock; i += 5000) {
      const _startBlock = i;
      const _endBlock = Math.min(endBlock, i + 4999);
      const events = await contract.queryFilter(eventFilter, _startBlock, _endBlock);
      // console.log(events);

      for(let l=0; l < events.length; l++){
        // console.log(e);
        if(events[l].event == "RoleGranted" ){
            // console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.to, e.args.amount);
            txCount++;
           console.log(events[l].args)
        }
      }
      console.log('==== block ', i);

    }

    return null;
  };

main()
  .then(() => process.exit(0))
  .catch((error) => {


    console.error(error);
    process.exit(1);
  });