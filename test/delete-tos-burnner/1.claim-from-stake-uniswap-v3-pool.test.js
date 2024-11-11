const chai = require("chai");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const Web3EthAbi = require('web3-eth-abi');
const {
  keccak256,
} = require("web3-utils");

const {
    defaultSender,
    contract,
    web3,
    privateKeys,
  } = require("@openzeppelin/test-environment");

let TOSToken = require('../../abis/TOS.json');
let TONToken = require('../../abis/TOS.json');

let UniswapV3Factory = require('../../abis/UniswapV3Factory.json');
let UniswapV3Pool = require('../../abis/UniswapV3Pool.json');
let NonfungiblePositionManager = require('../../abis/NonfungiblePositionManager.json');
let StakeTONProxy2 = require('../../abis/StakeTONProxy2.json');
let StakeTONProxy = require('../../abis/StakeTONProxy.json');
let StakeTON = require('../../abis/StakeTON.json');
let StakeTONUpgrade2 = require('../../abis/StakeTONUpgrade2.json');
let Stake1Proxy = require('../../abis/Stake1Proxy.json');
let Stake1Logic = require('../../abis/Stake1Logic.json');
let Stake2VaultProxy = require('../../abis/Stake2VaultProxy.json');
let StakeUniswapV3 = require("../../abis/StakeUniswapV3.json");

let StakingV2 = require("../../abis/StakingV2.json");
let Treasury = require("../../abis/Treasury.json");


let adminAddress ="0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1"
let tosAdminAddress ="0x12A936026F072d4e97047696A9d11F97Eae47d21"
let stake5AdminAddress = "0x21Db1777Dd95749A849d9e244136E72bd93082Ea"

// mainnet
let deployedInfo = {
    stakeTON_1: "0x9a8294566960ab244d78d266ffe0f284cdf728f1",
    stakeTON_2: "0x7da4e8ab0bb29a6772b6231b01ea372994c2a49a",
    stakeTON_3: "0xFC1fC3a05EcdF6B3845391aB5CF6a75aeDef7CeA",
    stakeTON_4: "0x9F97b34161686d60ADB955ed63A2FC0b2eC0a2a9",
    stakeTON_5: "0x21Db1777Dd95749A849d9e244136E72bd93082Ea",
    wtontosPoolAddress: "0x1c0ce9aaa0c12f53df3b4d8d77b82d6ad343b4e4",
    stake1Proxy: "0x8e539e29D80fd4cB3167409A82787f3B80bf9113",
    stake2VaultProxy: "0xB9C3531f1230De8E775F386f3B57d6dCB3F0202a",
    stakeUniswapV3Proxy: "0xC1349A9a33A0682804c390a3968e26E5a2366153",
    nonfungiblePositionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
}

let changed = {
    proxy: "0xa16412aCF22b70DDCCeBcAFA75E773bb1879B341",
    imp0: "0x07bC0A6036d8448DA9cB06Da859f35086533188C",
    imp1: "0xE75D8392c2EEd2425AFC7fcFba88D340b493ccC2",
    imp2: "0x523eD202d3591b70cC4ab19d10BDe036EAe3361F",
    imp3: "0x369A0F8eAb20992130170A1A37A1B688052f6278",
    imp4: "0xE6387C2ad36a8a9D96b5DAE14F86dcb15e196592",
    imp5: "0xea537302701Da28695b819f05D036b101Ec73825"
}

let contractInfos = {
    "TOS": "0x409c4D8cd5d2924b9bc5509230d16a61289c8153",
    "StakeTON": "0xD08C561507fD6F6Df662a239Bb49B8A773e6e411",
    "StakeTONProxyFactory": "0x4eA3C549C9A041Ad7B83003cd8572b9DBdeEC7F1",
    "StakeTONFactory": "0x8Dde0854A6A6781720E0a4462a8648c89D861b16",
    "StakeFactory": "0x942286FC535Cab49b7C8b650369305ba8b4a2e4c",
    "StakeRegistry": "0x4Fa71D6964a97c043CA3103407e1B3CD6b5Ab367",
    "Stake1Vault": "0xfE78C5A77323274A1afc6669C5ebd2494981ae8d",
    "StakeVaultFactory": "0x0f559A3130e5390f59694ad931B04a5904b8C130",
    "Stake1Logic": "0xcC0b93aF31d3c85416CbdF8Fc471C1D8da6768bb",
    "Stake1Proxy": "0x8e539e29D80fd4cB3167409A82787f3B80bf9113",
    "TON": "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
    "WTON": "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2",
    "DepositManager": "0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e",
    "SeigManager": "0x0b55a0f463b6defb81c6063973763951712d0e5f",
    "SwapProxy": "0x30e65B3A6e6868F044944Aa0e9C5d52F8dcb138d",
    "StakingV2Proxy": "0x14fb0933Ec45ecE75A431D10AFAa1DDF7BfeE44C",
    "TreasuryProxy": "0xD27A68a457005f822863199Af0F817f672588ad6"
}

let changedLayer = "0x0F42D1C40b95DF7A1478639918fc358B4aF5298D"

const stakerList = [
    '0x986d9bb496abd602ffbab9291a2621834f0f03a3',
    '0x522bc7ef73d8f0c7af883104bd3aeb24cc2c5e2a',
    '0x7ffbb3c77cd4a0c8db29178141a133fed2daf1f9',
    '0xfd8c68ad3fe13ae376422de548fa567d8f99aaad',
    '0x58767417f1e9f0d2287874c61d4a1ca75e7e8b10',
    '0xc206248e8c2a45bd1d904aa8cffcab07d401f291',
    '0x47d9e217c981eb4e0cecdfe4663e5ff9f8b74b1f',
    '0x58dbfe31ce1e639ec9d0da60d82cabce637b2ba4'
  ]

  async function claims(tosContract, stakers, contractAddress) {
    console.log('-- claims :' , stakers.length)
    const contract = await ethers.getContractAt(StakeUniswapV3.abi, contractAddress);

    let i = 0
    for (i = 0 ; i < stakers.length; i++) {
        let userAddress = stakers[i]
        // console.log('-- userAddress :' , userAddress)

        await hre.network.provider.send("hardhat_impersonateAccount", [
            userAddress,
        ]);
        await ethers.provider.send("hardhat_setBalance", [
            userAddress,
            "0x10000000000000000000000000",
        ]);
        let user = await hre.ethers.getSigner(userAddress);

        let userStakedTokenIds  = await contract.getUserStakedTokenIds(userAddress)
        let tosBalanceBefore = await tosContract.balanceOf(userAddress)
        let userTotalStakedBefore = await contract.userTotalStaked(userAddress)
        // console.log("tosBalanceBefore ", userAddress, tosBalanceBefore )
        // console.log("userTotalStakedBefore ", userAddress, userTotalStakedBefore )

        let len = userStakedTokenIds.length
        let j = 0
        for (j = 0; j < len ; ++j) {
            console.log('-- claim exec -- ', j , userStakedTokenIds[j])
            await (await contract.connect(user).claim(userStakedTokenIds[j])).wait()
            let tosBalanceAfter = await tosContract.balanceOf(userAddress)
            let userTotalStakedAfter  = await contract.userTotalStaked(userAddress)
            // console.log("tosBalanceAfter ", userAddress, tosBalanceAfter )
            // consolconsoe.log("userTotalStakedAfter ", userAddress, userTotalStakedAfter )
            expect(tosBalanceAfter).to.be.gt(tosBalanceBefore)
            // expect(userTotalStakedBefore.totalMiningAmount).to.be.gt(userTotalStakedAfter.totalMiningAmount)
            // expect(userStaked.claimedBlock).to.be.gt(ethers.constants.Zero)
        }
    }

}

async function withdrawals(tosContract, stakers, contractAddress) {
    console.log('-- withdrawals : the number of accounts:' , stakers.length)
    const contract = await ethers.getContractAt(StakeUniswapV3.abi, contractAddress);
    const nonfungiblePositionManager = await ethers.getContractAt(NonfungiblePositionManager.abi, deployedInfo.nonfungiblePositionManager);

    let i = 0
    for (i = 0 ; i < stakers.length; i++) {
        let userAddress = stakers[i]
        // console.log('-- userAddress :' , userAddress)

        await hre.network.provider.send("hardhat_impersonateAccount", [
            userAddress,
        ]);
        await ethers.provider.send("hardhat_setBalance", [
            userAddress,
            "0x10000000000000000000000000",
        ]);
        let user = await hre.ethers.getSigner(userAddress);

        let userStakedTokenIds  = await contract.getUserStakedTokenIds(userAddress)
        let tosBalanceBefore = await tosContract.balanceOf(userAddress)
        let userTotalStakedBefore = await contract.userTotalStaked(userAddress)
        // console.log("tosBalanceBefore ", userAddress, tosBalanceBefore )
        // console.log("userTotalStakedBefore ", userAddress, userTotalStakedBefore )

        let len = userStakedTokenIds.length
        let j = 0
        for (j = 0; j < len ; ++j) {
            let tokenId = userStakedTokenIds[j]
            console.log('-- withdraw exec -- ', j , tokenId)
            expect((await nonfungiblePositionManager.ownerOf(tokenId)).toLowerCase()).to.be.eq(contractAddress.toLowerCase())
            await (await contract.connect(user).withdraw(userStakedTokenIds[j])).wait()
            expect((await nonfungiblePositionManager.ownerOf(tokenId)).toLowerCase()).to.be.eq(userAddress.toLowerCase())

            let tosBalanceAfter = await tosContract.balanceOf(userAddress)
            let userTotalStakedAfter  = await contract.userTotalStaked(userAddress)

            // console.log("tosBalanceAfter ", userAddress, tosBalanceAfter )
            // console.log("userTotalStakedAfter ", userAddress, userTotalStakedAfter )

            expect(tosBalanceAfter).to.be.gte(tosBalanceBefore)

            if (userTotalStakedAfter.totalDepositAmount.eq(ethers.constants.Zero)) {
                expect(userTotalStakedAfter.staked).to.be.eq(false)
                expect(userTotalStakedAfter.totalDepositAmount).to.be.eq(ethers.constants.Zero)
                expect(userTotalStakedAfter.totalMiningAmount).to.be.eq(ethers.constants.Zero)
                expect(userTotalStakedAfter.totalNonMiningAmount).to.be.eq(ethers.constants.Zero)
            }
        }

    }

}


async function checkClear(tosContract, stakers, contractAddress) {
    // console.log('-- checkClear :' , stakers.length)
    const contract = await ethers.getContractAt(StakeUniswapV3.abi, contractAddress);

    let i = 0
    for (i = 0 ; i < stakers.length; i++) {
        let userAddress = stakers[i]
        let userStakedTokenIds  = await contract.getUserStakedTokenIds(userAddress)
        let tosBalanceBefore = await tosContract.balanceOf(userAddress)
        let userTotalStakedBefore = await contract.userTotalStaked(userAddress)
        // console.log("tosBalanceBefore ", userAddress, tosBalanceBefore )
        // console.log("userTotalStakedBefore ", userAddress, userTotalStakedBefore )
        expect(userTotalStakedBefore.staked).to.be.eq(false)
        expect(userTotalStakedBefore.totalDepositAmount).to.be.eq(ethers.constants.Zero)
        expect(userTotalStakedBefore.totalMiningAmount).to.be.eq(ethers.constants.Zero)
        expect(userTotalStakedBefore.totalNonMiningAmount).to.be.eq(ethers.constants.Zero)

        expect(userStakedTokenIds.length ).to.be.eq(0)
    }

}

describe("Delete Admin & TOS Bunner", function () {
    let tokamakStakeUpgrade4;
    let stakeTON1, stakeTONProxy, stakeTON1Proxy, stakeTON1Proxy2,  stakeTON2, stakeTON3, stakeTON4, stakeTON5;
    let provider;
    let tester, logic, admin, tosAdmin, stake5Admin
    let func_withdraw, func_setTokamakLayer2
    let tonContract
    let stake1Proxy, stake2VaultProxy, stakeUniswapV3, stakingV2, treasury

    before(async function () {
        accounts = await ethers.getSigners();

        provider = ethers.provider;

        await hre.network.provider.send("hardhat_impersonateAccount", [
            adminAddress,
        ]);
        await ethers.provider.send("hardhat_setBalance", [
            adminAddress,
            "0x10000000000000000000000000",
        ]);
        admin = await hre.ethers.getSigner(adminAddress);

        await hre.network.provider.send("hardhat_impersonateAccount", [
            tosAdminAddress,
        ]);
        await ethers.provider.send("hardhat_setBalance", [
            tosAdminAddress,
            "0x10000000000000000000000000",
        ]);
        tosAdmin = await hre.ethers.getSigner(tosAdminAddress);

        await hre.network.provider.send("hardhat_impersonateAccount", [
            stake5AdminAddress,
        ]);
        await ethers.provider.send("hardhat_setBalance", [
            stake5AdminAddress,
            "0x10000000000000000000000000",
        ]);
        stake5Admin = await hre.ethers.getSigner(stake5AdminAddress);

        tonContract = await ethers.getContractAt(TONToken.abi, contractInfos.TON);
        tosContract = await ethers.getContractAt(TOSToken.abi, contractInfos.TOS);

        stakingV2 = await ethers.getContractAt(StakingV2.abi, contractInfos.StakingV2Proxy);
        treasury = await ethers.getContractAt(Treasury.abi, contractInfos.TreasuryProxy);

        func_setTokamakLayer2 = Web3EthAbi.encodeFunctionSignature("setTokamakLayer2()") ;
        // console.log("func_setTokamakLayer2",func_setTokamakLayer2);
        func_withdraw = Web3EthAbi.encodeFunctionSignature("withdraw()") ;
        // console.log("func_withdraw",func_withdraw);
    });

    it("Upgrade stakeTON_5", async function () {
        const abi = [
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "target",
                    "type": "address"
                  },
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "grantRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_stakeProxy",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_implementation",
                    "type": "address"
                  }
                ],
                "name": "upgradeStakeTo",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
        ]
        const abiUpdated = [
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_layer2",
                    "type": "address"
                  }
                ],
                "name": "setTokamakLayer2",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "tokamakLayer2",
                "outputs": [
                  {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                  }
                ],
                "stateMutability": "view",
                "type": "function"
              },
        ]
        stake1Proxy = await ethers.getContractAt(Stake1Proxy.abi, deployedInfo.stake1Proxy, provider);
        stake1ProxyLogic = await ethers.getContractAt(abi, deployedInfo.stake1Proxy, provider);

        stakeTON_5 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_5, provider);
        stakeTON_5_2 = await ethers.getContractAt(StakeTONProxy2.abi, deployedInfo.stakeTON_5, provider);
        stakeTON_5_2_updaged = await ethers.getContractAt(abiUpdated, deployedInfo.stakeTON_5, provider);

        const ADMIN_ROLE = keccak256("ADMIN");
        // console.log('ADMIN_ROLE', ADMIN_ROLE)
        //====================
        expect(await stake1Proxy.isAdmin(admin.address)).to.be.eq(true)
        let old_implementaion = await stakeTON_5.implementation()
        // console.log('old_implementaion', old_implementaion)

        await (await stake1ProxyLogic.connect(admin).grantRole(
            deployedInfo.stakeTON_5,
            '0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42',
            admin.address)).wait()
        expect(await stakeTON_5.isAdmin(admin.address)).to.be.eq(true)

        await (await stake1ProxyLogic.connect(admin).upgradeStakeTo(deployedInfo.stakeTON_5, changed.proxy)).wait()
        expect(await stakeTON_5.implementation()).to.be.eq(changed.proxy)
        //====================

        await (await stakeTON_5_2.connect(admin).setImplementation2(changed.imp0, 0, true)).wait()
        expect(await stakeTON_5_2.implementation2(0)).to.be.eq(changed.imp0)

        await (await stakeTON_5_2.connect(admin).setImplementation2(changed.imp1, 1, true)).wait()
        expect(await stakeTON_5_2.implementation2(1)).to.be.eq(changed.imp1)

        await (await stakeTON_5_2.connect(admin).setSelectorImplementations2([func_withdraw], changed.imp1)).wait()

        expect(await stakeTON_5_2.getSelectorImplementation2(func_setTokamakLayer2)).to.be.eq(changed.imp0)
        expect(await stakeTON_5_2.getSelectorImplementation2('0x3ccfd60b')).to.be.eq(changed.imp1)

        //====================
        await (await stakeTON_5_2_updaged.connect(admin).setTokamakLayer2(changedLayer)).wait()
        expect(await stakeTON_5_2.tokamakLayer2()).to.be.eq(changedLayer)

        let layer = await stakeTON_5_2.tokamakLayer2()
        // console.log('layer', layer)
    })

    it("Remove Admin ", async function () {
        stakeTON_1 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_1, provider);
        stakeTON_2 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_2, provider);
        stakeTON_3 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_3, provider);
        stakeTON_4 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_4, provider);
        stakeTON_5 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_5, provider);

        stake2VaultProxy = await ethers.getContractAt(Stake2VaultProxy.abi, deployedInfo.stake2VaultProxy, provider);

        // stakeTON_5_2 = await ethers.getContractAt(StakeTONProxy2.abi, deployedInfo.stakeTON_5, provider);

        expect(await stakeTON_1.isAdmin(admin.address)).to.be.eq(true)
        await (await stakeTON_1.connect(admin).removeAdmin(admin.address)).wait()
        expect(await stakeTON_1.isAdmin(admin.address)).to.be.eq(false)

        expect(await stakeTON_2.isAdmin(admin.address)).to.be.eq(true)
        await (await stakeTON_2.connect(admin).removeAdmin(admin.address)).wait()
        expect(await stakeTON_2.isAdmin(admin.address)).to.be.eq(false)

        expect(await stakeTON_3.isAdmin(admin.address)).to.be.eq(true)
        await (await stakeTON_3.connect(admin).removeAdmin(admin.address)).wait()
        expect(await stakeTON_3.isAdmin(admin.address)).to.be.eq(false)

        expect(await stakeTON_4.isAdmin(admin.address)).to.be.eq(true)
        await (await stakeTON_4.connect(admin).removeAdmin(admin.address)).wait()
        expect(await stakeTON_4.isAdmin(admin.address)).to.be.eq(false)

        expect(await stakeTON_5.isAdmin(admin.address)).to.be.eq(true)
        await (await stakeTON_5.connect(admin).removeAdmin(admin.address)).wait()
        expect(await stakeTON_5.isAdmin(admin.address)).to.be.eq(false)

        expect(await stake2VaultProxy.isAdmin(admin.address)).to.be.eq(true)
        await (await stake2VaultProxy.connect(admin).removeAdmin(admin.address)).wait()
        expect(await stake2VaultProxy.isAdmin(admin.address)).to.be.eq(false)
    });

    it("Delete TOS Burnner", async function () {
        expect(await tosContract.isAdmin(tosAdmin.address)).to.be.eq(true)

        expect(await tosContract.isBurner(deployedInfo.stakeTON_1)).to.be.eq(true)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_2)).to.be.eq(true)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_3)).to.be.eq(true)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_4)).to.be.eq(true)
        expect(await tosContract.isBurner(deployedInfo.stake2VaultProxy)).to.be.eq(true)

        await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stakeTON_1)).wait()
        await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stakeTON_2)).wait()
        await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stakeTON_3)).wait()
        await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stakeTON_4)).wait()

        // The tos burn permission of stake2VaultProxy must not be deleted.
        // await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stake2VaultProxy)).wait()

        expect(await tosContract.isBurner(deployedInfo.stakeTON_1)).to.be.eq(false)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_2)).to.be.eq(false)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_3)).to.be.eq(false)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_4)).to.be.eq(false)
        // expect(await tosContract.isBurner(deployedInfo.stake2VaultProxy)).to.be.eq(false)
    })

    it("Delete TOS Admin", async function () {
        expect(await tosContract.isAdmin(tosAdmin.address)).to.be.eq(true)
        await (await tosContract.connect(tosAdmin).removeAdmin(tosAdmin.address)).wait()
        expect(await tosContract.isAdmin(tosAdmin.address)).to.be.eq(false)
    })

    it("Claim & Withdraw", async function () {

        let totalBefore = await tosContract.totalSupply()
        let backingRateETHPerTOS = await treasury.backingRateETHPerTOS()

        console.log('TOS TotalSupply: ', totalBefore)
        console.log('backingRateETHPerTOS', ethers.utils.formatEther(backingRateETHPerTOS), "ETH")

        // await claims(tosContract, stakerList, deployedInfo.stakeUniswapV3Proxy)
        await withdrawals(tosContract, stakerList, deployedInfo.stakeUniswapV3Proxy)
        await checkClear(tosContract, stakerList, deployedInfo.stakeUniswapV3Proxy)

        let totalAfter = await tosContract.totalSupply()
        backingRateETHPerTOS = await treasury.backingRateETHPerTOS()

        console.log('TOS TotalSupply after all withdrawing of Pools :', totalAfter)
        console.log('backingRateETHPerTOS',  ethers.utils.formatEther(backingRateETHPerTOS), "ETH")

    })

});
