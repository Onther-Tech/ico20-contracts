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

let StakeTONProxy2 = require('../../abis/StakeTONProxy2.json');
let StakeTONProxy = require('../../abis/StakeTONProxy.json');
let StakeTON = require('../../abis/StakeTON.json');
let StakeTONUpgrade2 = require('../../abis/StakeTONUpgrade2.json');

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
}

let changedLayer = "0x0F42D1C40b95DF7A1478639918fc358B4aF5298D"
// const testerAddress = "0x36f917BBd70d31F0501fCe2Cd1756A977d783E44";

const testerAddress1 = "0x9ceB3E173D67997dFBa57025C4a016efdcAfBF17";
const stakerAddress1 = "0x128eb26ac40bc62f1d7eec9bcb0b2a72b5bc73ab"

const testerAddress2 = "0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1";
const stakerAddress2 = "0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1"

const testerAddress3 = "0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1";
const stakerAddress3 = "0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1"

const testerAddress4 = "0x7ee93e58f1784f23956de508ed0ec33ec8be9701";
const stakerAddress4 = "0x7ee93e58f1784f23956de508ed0ec33ec8be9701"

const testerAddress5 = null
const stakerAddress5 = "0xe12ea99b2a6603ec19e3138a92d8f0101a588031";

// 5번째 톤스테이크 의 경우, 레이어주소가 이전 레이어주소로 설정되어 있어서, withdraw 가 안된다.
// 현재 24.12 톤을 0xe12ea99b2a6603ec19e3138a92d8f0101a588031 사용자가 가져가지 않음.
// 클래임은 잘 된다.
//
// 3년전 종료된 컨트랙이라서 업그레이드를 하지 않았음. 오너권한도 가지고 있지 않음.
// Stake1Proxy 컨트랙을 통해 Stake1Proxy 오너가 로직 수행해서 오너를 지정할 수 있게 해야 하고, 함수도 추가해야함.
// 가스비도 많이 들어감.
// https://etherscan.io/address/0x8e539e29D80fd4cB3167409A82787f3B80bf9113#writeProxyContract#F24
//
// 사용자 민원이 있을때, 톤을 주는게 더 나을것 같음.
//const stakeContract5 = "0x21Db1777Dd95749A849d9e244136E72bd93082Ea";
// 14      0xe12ea99b2a6603ec19e3138a92d8f0101a588031      24120000000000000000      false      3093070872029554319

async function withdraw(tonContract, userAddress, stakeTON_Address) {
    console.log('-- withdraw :' , userAddress)
    const contract = await ethers.getContractAt(StakeTON.abi, stakeTON_Address);

    await hre.network.provider.send("hardhat_impersonateAccount", [
        userAddress,
    ]);
    await ethers.provider.send("hardhat_setBalance", [
        userAddress,
        "0x10000000000000000000000000",
    ]);
    let user = await hre.ethers.getSigner(userAddress);
    let userStaked  = await contract.userStaked(userAddress)
    let tonBalanceBefore = await tonContract.balanceOf(userAddress)

    if (userStaked.released == false) {
        console.log('-- withdraw exec --- ')
        await (await contract.connect(user).withdraw()).wait()
        let tonBalanceAfter = await tonContract.balanceOf(user.address)
        userStaked  = await contract.userStaked(user.address)
        expect(tonBalanceAfter).to.be.gt(tonBalanceBefore)
        expect(userStaked.released).to.be.eq(true)
    }
}

async function withdraws(tonContract, stakers, stakeTON_Address) {
    console.log('-- withdraws :' , stakers.length)
    const contract = await ethers.getContractAt(StakeTON.abi, stakeTON_Address);

    let i = 0
    for (i ; i< stakers.length; i++) {
        let userAddress = stakers[i]
        await hre.network.provider.send("hardhat_impersonateAccount", [
            userAddress,
        ]);
        await ethers.provider.send("hardhat_setBalance", [
            userAddress,
            "0x10000000000000000000000000",
        ]);
        let user = await hre.ethers.getSigner(userAddress);
        let userStaked  = await contract.userStaked(userAddress)
        let tonBalanceBefore = await tonContract.balanceOf(userAddress)

        if (userStaked.released == false) {
            console.log('-- withdraw exec --- ', i )
            await (await contract.connect(user).withdraw()).wait()
            let tonBalanceAfter = await tonContract.balanceOf(userAddress)
            userStaked  = await contract.userStaked(userAddress)
            expect(tonBalanceAfter).to.be.gt(tonBalanceBefore)
            expect(userStaked.released).to.be.eq(true)
        }
    }

}

async function claim(tosContract, userAddress, stakeTON_Address) {

    await hre.network.provider.send("hardhat_impersonateAccount", [
        userAddress,
    ]);
    await ethers.provider.send("hardhat_setBalance", [
        userAddress,
        "0x10000000000000000000000000",
    ]);
    let user = await hre.ethers.getSigner(userAddress);
    const contract = await ethers.getContractAt(StakeTON.abi, stakeTON_Address);


    let block = await ethers.provider.getBlock('latest')
    let userStaked  = await contract.userStaked(userAddress)

    let tosBalanceBefore = await tosContract.balanceOf(userAddress)
    let canRewardAmount = await contract.canRewardAmount(userAddress, block.number)

    if (canRewardAmount.gt(ethers.constants.Zero)) {
        console.log('-- claim')
        await (await contract.connect(user).claim()).wait()
        let tosBalanceAfter = await tosContract.balanceOf(user.address)
        userStaked  = await contract.userStaked(user.address)
        let block1 = await ethers.provider.getBlock('latest')
        canRewardAmount = await contract.canRewardAmount(user.address, block1.number)
        expect(tosBalanceAfter).to.be.gt(tosBalanceBefore)
        expect(canRewardAmount).to.be.eq(ethers.constants.Zero)
        expect(userStaked.claimedBlock).to.be.gt(ethers.constants.Zero)
    }

}

async function claims(tosContract, stakers, stakeTON_Address) {
    console.log('-- claims :' , stakers.length)
    const contract = await ethers.getContractAt(StakeTON.abi, stakeTON_Address);
    let block = await ethers.provider.getBlock('latest')
    let i = 0
    for (i ; i< stakers.length; i++) {
        let userAddress = stakers[i]
        await hre.network.provider.send("hardhat_impersonateAccount", [
            userAddress,
        ]);
        await ethers.provider.send("hardhat_setBalance", [
            userAddress,
            "0x10000000000000000000000000",
        ]);
        let user = await hre.ethers.getSigner(userAddress);
        let userStaked  = await contract.userStaked(userAddress)
        let tosBalanceBefore = await tosContract.balanceOf(userAddress)
        let canRewardAmount = await contract.canRewardAmount(userAddress, block.number)

        if (canRewardAmount.gt(ethers.constants.Zero)) {
            console.log('-- claim exec -- ', i , userAddress)
            await (await contract.connect(user).claim()).wait()
            let tosBalanceAfter = await tosContract.balanceOf(userAddress)
            userStaked  = await contract.userStaked(userAddress)
            let block1 = await ethers.provider.getBlock('latest')
            canRewardAmount = await contract.canRewardAmount(userAddress, block1.number)
            expect(tosBalanceAfter).to.be.gt(tosBalanceBefore)
            expect(canRewardAmount).to.be.eq(ethers.constants.Zero)
            expect(userStaked.claimedBlock).to.be.gt(ethers.constants.Zero)
        } else {
            console.log(' *** -- claim no exec ', i, userAddress)
            console.log(' userStaked', userStaked)

        }

    }

}

describe("Delete Admin & TOS Bunner", function () {
    let tokamakStakeUpgrade4;
    let stakeTON1, stakeTONProxy, stakeTON1Proxy, stakeTON1Proxy2,  stakeTON2, stakeTON3, stakeTON4, stakeTON5;
    let provider;
    let tester, logic, admin, tosAdmin, stake5Admin
    let func_withdraw
    let tonContract

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




        // let _func1 = Web3EthAbi.encodeFunctionSignature("withdraw()") ;
        // expect(await contract.getSelectorImplementation2(_func1)).to.be.equal(stakeTONUpgrade3.address);
        // for (let i = 0; i < stakeAddresses.length; i++) {
        //   if (stakeAddresses[i] != null) {
        //     let contract = await StakeTONProxy2.at(stakeAddresses[i], { from: defaultSender });
        //     await contract.setImplementation2(stakeTONUpgrade3.address, 1, true, { from: defaultSender });
        //     expect(await contract.implementation2(1)).to.be.equal(stakeTONUpgrade3.address);
        //     await contract.setSelectorImplementations2([_func1], stakeTONUpgrade3.address, { from: defaultSender });
        //     expect(await contract.getSelectorImplementation2(_func1)).to.be.equal(stakeTONUpgrade3.address);
        //   }
        // }

    });

    it("Remove Admin of stakeTON", async function () {
        stakeTON_1 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_1, provider);
        stakeTON_2 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_2, provider);
        stakeTON_3 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_3, provider);
        stakeTON_4 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_4, provider);
        stakeTON_5 = await ethers.getContractAt(StakeTONProxy.abi, deployedInfo.stakeTON_5, provider);
        stakeTON_5_2 = await ethers.getContractAt(StakeTONProxy2.abi, deployedInfo.stakeTON_5, provider);

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

        // stakeTON_5 는 레이어주소를 바꿔주어야 성공함. 그런데 오너권한이 컨트랙 자체에게 있음. 프록시, 로직 변경 필요함.
        const contract = await ethers.getContractAt(StakeTON.abi, deployedInfo.stakeTON_5);
        await (await contract.connect(stake5Admin).setTokamakLayer2(changedLayer)).wait()

        expect(await stakeTON_5.isAdmin(stake5Admin.address)).to.be.eq(true)
        await (await stakeTON_5.connect(stake5Admin).removeAdmin(stake5Admin.address)).wait()
        expect(await stakeTON_5.isAdmin(stake5Admin.address)).to.be.eq(false)

    });

    it("Delete TOS Burnner", async function () {
        expect(await tosContract.isAdmin(tosAdmin.address)).to.be.eq(true)

        expect(await tosContract.isBurner(deployedInfo.stakeTON_1)).to.be.eq(true)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_2)).to.be.eq(true)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_3)).to.be.eq(true)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_4)).to.be.eq(true)

        await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stakeTON_1)).wait()
        await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stakeTON_2)).wait()
        await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stakeTON_3)).wait()
        await (await tosContract.connect(tosAdmin).removeBurner(deployedInfo.stakeTON_4)).wait()

        expect(await tosContract.isBurner(deployedInfo.stakeTON_1)).to.be.eq(false)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_2)).to.be.eq(false)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_3)).to.be.eq(false)
        expect(await tosContract.isBurner(deployedInfo.stakeTON_4)).to.be.eq(false)
    })

    it("Delete TOS Admin", async function () {
        expect(await tosContract.isAdmin(tosAdmin.address)).to.be.eq(true)
        await (await tosContract.connect(tosAdmin).removeAdmin(tosAdmin.address)).wait()
        expect(await tosContract.isAdmin(tosAdmin.address)).to.be.eq(false)
    })
    /*
    it("StakeTON1 : withdraw", async function () {
        const stakers = [
            '0x128eb26ac40bc62f1d7eec9bcb0b2a72b5bc73ab',
            '0x4484182cfe755ea63a20dcd34da69adaf4da9c38',
            '0x63aea877b5d5fa234a1532f1b26a4f6d9051866e',
            '0x2639b6ce4471e841b8a85e2a89e64c464c55beb5',
            '0x58767417f1e9f0d2287874c61d4a1ca75e7e8b10',
            '0x828f8294daf20deb3b59d14f74de4150a876b632',
            '0xd37f7703dee2755c9179900fb77b9fdac1048fe9',
            '0x51534ad69d20343bf0a542726e3e0abafe48324f',
            '0xcd6249830bc9bc34aed1d357c43b16c3a878fd91',
            '0x467a4d091d018e866a8b68011eac09f7fafc0378',
            '0x99c05440fd1c0d6fbb665bbb58f3b3fe9b73129b',
            '0x4be707df3d526f523866510cf5250bed7674375a',
            '0x5dff1fb3b226584277df0d079887f0cfe4f31fc3',
            '0xaadf125ab9461ff16f44bc8b3bd7742ff81b996a',
            '0x05e09a020b433b993d4e011aea3a7db85b8cb2d9',
            '0x4c15251cc289ffcef33ac9d138ace279366fe8b7',
            '0xc881c2281b1b37ef5ee83dd4595c82490a0fd91c',
            '0xa226c6b9f326424b29bb9e8e1d0f35e3fb624f20',
            '0x15576e2dd41e40f07679b304e84a81eb56607c6b',
            '0x986d9bb496abd602ffbab9291a2621834f0f03a3',
            '0x233efcbcc678b2ca9ad46dd17d016f7e81f8211b',
            '0x4c15251cc289ffcef33ac9d138ace279366fe8b7',
            '0x94566fae2898502c46ee70970a0869f9565eaef4',
            '0xffa8ca45bcedec73b6fdf3aff84af448aa368f93',
            '0xbf265ca7c7ace01469959aad580171ad6d43d8f3',
            '0xa9d82a03077a7b764dc912993a34f41dd996c68d',
            '0x233efcbcc678b2ca9ad46dd17d016f7e81f8211b',
            '0x42ecabfbdb1480682e821c3badabd9ffd3f8a940',
            '0x15576e2dd41e40f07679b304e84a81eb56607c6b',
            '0x1240ecadb73376e463aabbdc7d47c0658c2688e7',
            '0x53a6466d5e43367d545ead746a09e1cecaf6472c',
            '0xbf265ca7c7ace01469959aad580171ad6d43d8f3'
        ]

        await withdraws(tonContract, stakers, deployedInfo.stakeTON_1)
    });


    it("StakeTON1 : claim", async function () {
        const claimers = [
            '0x128eb26ac40bc62f1d7eec9bcb0b2a72b5bc73ab',
            '0x9ceb3e173d67997dfba57025c4a016efdcafbf17',
            '0x4484182cfe755ea63a20dcd34da69adaf4da9c38',
            '0x63aea877b5d5fa234a1532f1b26a4f6d9051866e',
            '0x2639b6ce4471e841b8a85e2a89e64c464c55beb5',
            '0x58767417f1e9f0d2287874c61d4a1ca75e7e8b10',
            '0x828f8294daf20deb3b59d14f74de4150a876b632',
            '0xd37f7703dee2755c9179900fb77b9fdac1048fe9',
            '0x51534ad69d20343bf0a542726e3e0abafe48324f',
            '0xcd6249830bc9bc34aed1d357c43b16c3a878fd91',
            '0x467a4d091d018e866a8b68011eac09f7fafc0378',
            '0x99c05440fd1c0d6fbb665bbb58f3b3fe9b73129b',
            '0x4be707df3d526f523866510cf5250bed7674375a',
            '0x5dff1fb3b226584277df0d079887f0cfe4f31fc3',
            '0xaadf125ab9461ff16f44bc8b3bd7742ff81b996a',
            '0x298893f7ac2bdf66b0e6110a6166a59ac88de5c3',
            '0x4c15251cc289ffcef33ac9d138ace279366fe8b7',
            '0xc881c2281b1b37ef5ee83dd4595c82490a0fd91c',
            '0xa226c6b9f326424b29bb9e8e1d0f35e3fb624f20',
            '0x15576e2dd41e40f07679b304e84a81eb56607c6b',
            '0x986d9bb496abd602ffbab9291a2621834f0f03a3',
            '0x7298c6216c4d95bca5ee16b38e51ed5641535878',
            '0x233efcbcc678b2ca9ad46dd17d016f7e81f8211b',
            '0x4c15251cc289ffcef33ac9d138ace279366fe8b7',
            '0x94566fae2898502c46ee70970a0869f9565eaef4',
            '0xffa8ca45bcedec73b6fdf3aff84af448aa368f93',
            '0xbf265ca7c7ace01469959aad580171ad6d43d8f3',
            '0xcfd1a1e5608b4d7520a556f13d3c459897142bb8',
            '0xa9d82a03077a7b764dc912993a34f41dd996c68d',
            '0x42ecabfbdb1480682e821c3badabd9ffd3f8a940',
            '0x15576e2dd41e40f07679b304e84a81eb56607c6b',
            '0x1240ecadb73376e463aabbdc7d47c0658c2688e7',
            '0x53a6466d5e43367d545ead746a09e1cecaf6472c',
            '0x0259095c75f968cd0e42ed18a5934248d2751bf0',
            '0xbf265ca7c7ace01469959aad580171ad6d43d8f3',
                    ]

        await claims(tosContract, claimers, deployedInfo.stakeTON_1)
    });


    it("StakeTON2 : withdraw", async function () {
        const stakers = [
            '0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1',
            '0x6deda6fffff6ff8617e53f09c30a2f56f9d243f0',
            '0xd040baeb020692d62a0ec7811fb6be9b96f9844e',
        ]
        await withdraws(tonContract, stakers, deployedInfo.stakeTON_2)
    });

    it("StakeTON2 : claim", async function () {
        const claimers = [
            '0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1',
            '0x6deda6fffff6ff8617e53f09c30a2f56f9d243f0',
            '0xd040baeb020692d62a0ec7811fb6be9b96f9844e'
        ]
        await claims(tosContract, claimers, deployedInfo.stakeTON_2)
    });


    it("StakeTON3 : withdraw", async function () {
        const stakers = [
            '0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1',
            '0x6deda6fffff6ff8617e53f09c30a2f56f9d243f0',
            '0xd040baeb020692d62a0ec7811fb6be9b96f9844e',
        ]
        await withdraws(tonContract, stakers, deployedInfo.stakeTON_3)
    });

    it("StakeTON3 : claim", async function () {
        const claimers = [
            '0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1',
            '0x6deda6fffff6ff8617e53f09c30a2f56f9d243f0',
            '0xd040baeb020692d62a0ec7811fb6be9b96f9844e',
        ]
        await claims(tosContract, claimers, deployedInfo.stakeTON_3)
    });

    it("StakeTON4 : withdraw", async function () {
        const stakers = [
            '0x7ee93e58f1784f23956de508ed0ec33ec8be9701',
            '0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1',
            '0x6deda6fffff6ff8617e53f09c30a2f56f9d243f0',
            '0xe12ea99b2a6603ec19e3138a92d8f0101a588031',
        ]
        await withdraws(tonContract, stakers, deployedInfo.stakeTON_4)
    });

    it("StakeTON4 : claim", async function () {
       const claimers = [
            '0x7ee93e58f1784f23956de508ed0ec33ec8be9701',
            '0x9cbfa7b7998bc3bbcc8335ef355a1d67465b31d1',
            '0x58dbfe31ce1e639ec9d0da60d82cabce637b2ba4',
            '0x6deda6fffff6ff8617e53f09c30a2f56f9d243f0',
            '0xa0eefa0880bdeae86329b40872bd4f58119cfcec',
            '0xe12ea99b2a6603ec19e3138a92d8f0101a588031',
        ]
        await claims(tosContract, claimers, deployedInfo.stakeTON_4)
    });
    */

    it("StakeTON5 : withdraw", async function () {
        const stakers = [
            '0xe12ea99b2a6603ec19e3138a92d8f0101a588031'
        ]
        await withdraws(tonContract, stakers, deployedInfo.stakeTON_5)
    })

    it("StakeTON5 : claim", async function () {
        const claimers = [
            '0x400eac04d03fce01eb41f785db19b0631df47fa3',
            '0xe12ea99b2a6603ec19e3138a92d8f0101a588031'
        ]
        await claims(tosContract, claimers, deployedInfo.stakeTON_5)
    });

});
