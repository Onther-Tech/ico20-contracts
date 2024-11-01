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

    await getData(stakeContract5);

}

async function getData(contractAddress) {
    const contract = await ethers.getContractAt(StakeSimpleABI, contractAddress, ethers.provider);

    const TONContract = await ethers.getContractAt(Erc20ABI, TON, ethers.provider);
    const TOSContract = await ethers.getContractAt(Erc20ABI, TOS, ethers.provider);
    const WTONContract = await ethers.getContractAt(Erc20ABI, WTON, ethers.provider);
    const SeigManagerContract = await ethers.getContractAt(SeigManagerABI, SeigManager, ethers.provider);
    const DepositManagerContract = await ethers.getContractAt(DepositManagerABI, DepositManager, ethers.provider);

    console.log( 'contract ', contract.address);
    let balance = await TONContract.balanceOf(contract.address);
    console.log( 'TON balanceOf ', balance.toString());
    balance = await TOSContract.balanceOf(contract.address);
    console.log( 'TOS balanceOf ', balance.toString());
    balance = await WTONContract.balanceOf(contract.address);
    console.log( 'WTON balanceOf ', balance.toString());

    // let startBlock = 12880649;
    // let endBlock = 14441730;

    // stakeContract1
    // let startBlock = 12899725;
    // let endBlock = 12991362;

    // stakeContract2   12899725,12991362,
    // let startBlock = 12899725;
    // let endBlock = 12991362;

    let block = await ethers.provider.getBlock('latest')

    // stakeContract3  12899725,12991362,
    // let startBlock = 12899725;
    // let endBlock = 12991362;

    // stakeContract4   12899725,12991362,
    // let startBlock = 12899725;
    // let endBlock = 12991362;

    // stakeContract5  12899725,12991362,
    let startBlock = 12899725;
    let endBlock = 12991362;

    let allEvents = [];

    //endBlock = 13017541+10000;

    // [saleStartBlock, startBlock, endBlock],
    // stakeContract1 12899725,12991362,20165180

    let eventFilter = [
        contract.filters.Staked(null, null)
        ];
    let txCount = 0;
    for(let i = startBlock; i < endBlock; i += 5000) {
      const _startBlock = i;
      const _endBlock = Math.min(endBlock, i + 4999);
      const events = await contract.queryFilter(eventFilter, _startBlock, _endBlock);
      // console.log(events);

      for(let l=0; l< events.length; l++){
        // console.log(e);
        if(events[l].event == "Staked" ){
            // console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.to, e.args.amount);
            txCount++;
            let userStaked = await contract.userStaked(events[l].args.to);
            let canRewardAmount = await contract.canRewardAmount(events[l].args.to, block.number);
            add(events[l].args.to.toLowerCase(), events[l].args.amount, userStaked.released, canRewardAmount);
        }
      }
      console.log('==== block ', i);
      // for(let k=0; k< stakeInfos.length; k++){
      //   console.log( k,'    ', stakeInfos[k].account, '    ',stakeInfos[k].amount.toString(),'    ', stakeInfos[k].withdraw,'    ',  stakeInfos[k].canReward.toString());
      // }
      //allEvents = [...allEvents, ...events]
    }

    let sumAmount = ethers.constants.Zero
    // console.log('==== end block ', i );
    for(let h=0; h< stakeInfos.length; h++){

      if(stakeInfos[h].withdraw == false || stakeInfos[h].canReward.toString() != '0') {
        sumAmount = sumAmount.add(stakeInfos[h].amount)
        console.log( h,'    ', stakeInfos[h].account, '    ',stakeInfos[h].amount.toString(),'    ', stakeInfos[h].withdraw,'    ',  stakeInfos[h].canReward.toString());
      }
      // console.log( h,'    ', stakeInfos[h].account, '    ',stakeInfos[h].amount.toString(),'    ', stakeInfos[h].withdraw,'    ',  stakeInfos[h].canReward.toString());
    }
    console.log('sumAmount', sumAmount.toString())

    return null;
  };


  function add(user, amount, withdraw, canReward) {

    if(!stakers.includes(user)) {
       let data = {
          account: user,
          amount: amount,
          withdraw: withdraw,
          canReward: canReward
        }
        stakeInfos.push(data);
     } else {
       for(let i=0; i< stakeInfos.length ; i++){
          if(stakeInfos[i].account == user){
            stakeInfos[i].amount = stakeInfos[i].amount.add(amount)
            stakeInfos[i].withdraw = withdraw;
            stakeInfos[i].canReward = canReward;

          }
       }
     }
  }


main()
  .then(() => process.exit(0))
  .catch((error) => {

    for(i=0; i< stakeInfos.length; i++){
      console.log( i,'    ', stakeInfos[i].account, '    ',stakeInfos[i].amount.toString(),'    ', stakeInfos[i].withdraw,'    ',  stakeInfos[i].canReward.toString());
    }

    console.error(error);
    process.exit(1);
  });