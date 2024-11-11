const { ethers, upgrades } = require("hardhat");

const StakeSimpleABI = require("../../abis/StakeSimple.json").abi;
const Erc20ABI = require("../../abis/erc20ABI.json");
const SeigManagerABI = require("../../abis/SeigManager.json").abi;
const DepositManagerABI = require("../../abis/DepositManager.json").abi;
const StakeUniswapV3ABI = require("../../abis/StakeUniswapV3.json").abi;

const stake2VaultProxy = "0xB9C3531f1230De8E775F386f3B57d6dCB3F0202a";

const StakeUniswapV3Proxy = "0xC1349A9a33A0682804c390a3968e26E5a2366153";
const TON = "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5";
const WTON = "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2";
const TOS = "0x409c4D8cd5d2924b9bc5509230d16a61289c8153";
const SeigManager = "0x710936500aC59e8551331871Cbad3D33d5e0D909";
const DepositManager = "0x56e465f654393fa48f007ed7346105c7195cee43";

let stakers = [];
let tokenIds = []
let stakeInfos = []

async function main() {

    // let stakerList = await getStakers(StakeUniswapV3Proxy);

    let stakerList = [
        '0x986d9bb496abd602ffbab9291a2621834f0f03a3',
        '0x522bc7ef73d8f0c7af883104bd3aeb24cc2c5e2a',
        '0x7ffbb3c77cd4a0c8db29178141a133fed2daf1f9',
        '0xfd8c68ad3fe13ae376422de548fa567d8f99aaad',
        '0x58767417f1e9f0d2287874c61d4a1ca75e7e8b10',
        '0xc206248e8c2a45bd1d904aa8cffcab07d401f291',
        '0x47d9e217c981eb4e0cecdfe4663e5ff9f8b74b1f',
        '0x58dbfe31ce1e639ec9d0da60d82cabce637b2ba4'
      ]

}

async function getStakers(contractAddress) {
    const contract = await ethers.getContractAt(StakeUniswapV3ABI, contractAddress, ethers.provider);

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

    let startBlock = 12991501; // miningStartTime : 1628520211 Mon Aug 09 2021 23:43:31 GMT+0900 (한국 표준시)
    let endBlock = 13852784;  // miningEndTime : 1640055600 Tue Dec 21 2021 12:00:00 GMT+0900 (한국 표준시)

    let block = await ethers.provider.getBlock('latest')

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

      for(let l=0; l< events.length; l++){
        // console.log(e);
        let e = events[l]
        if(events[l].event == "Staked" ){
            // console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.tokenId, e.args.to, e.args.amount);
            // console.log("transactionHash",events[l].transactionHash)
            txCount++;

            let account = events[l].args.to
            account = account.toLowerCase()
            let tokenId = events[l].args.tokenId
            let stakedCoinageTokens = await contract.stakedCoinageTokens(tokenId);
            let userTotalStaked = await contract.userTotalStaked(account);
            if (userTotalStaked.staked == true) {
                console.log("Staked", account, tokenId, stakers.includes(account))
                if(!stakers.includes(account)) stakers.push(account)
            }
            // console.log("stakedCoinageTokens",events[l].args.tokenId, stakedCoinageTokens)
            // console.log("userTotalStaked",events[l].args.to, userTotalStaked)
            // add(events[l].transactionHash, events[l].args.to.toLowerCase(), events[l].args.amount, userStaked.released, canRewardAmount);
        }
      }
      console.log('==== block ', i);
    }

    // let stakers  8 [
    //     '0x986d9bb496abd602ffbab9291a2621834f0f03a3',
    //     '0x522bc7ef73d8f0c7af883104bd3aeb24cc2c5e2a',
    //     '0x7ffbb3c77cd4a0c8db29178141a133fed2daf1f9',
    //     '0xfd8c68ad3fe13ae376422de548fa567d8f99aaad',
    //     '0x58767417f1e9f0d2287874c61d4a1ca75e7e8b10',
    //     '0xc206248e8c2a45bd1d904aa8cffcab07d401f291',
    //     '0x47d9e217c981eb4e0cecdfe4663e5ff9f8b74b1f',
    //     '0x58dbfe31ce1e639ec9d0da60d82cabce637b2ba4'
    //   ]

    // console.log("stakers ", stakers.length, stakers)

    return stakers;
  };

main()
  .then(() => process.exit(0))
  .catch((error) => {

    // for(i=0; i< stakeInfos.length; i++){
    //   console.log( i,' ', stakeInfos[i].transactionHash,'  ', stakeInfos[i].account, '    ',stakeInfos[i].amount.toString(),'    ', stakeInfos[i].withdraw,'    ',  stakeInfos[i].canReward.toString());
    // }

    console.error(error);
    process.exit(1);
  });