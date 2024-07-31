require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("hardhat-gas-reporter");
require("dotenv/config");

require("dotenv").config();

require("./tasks/get-lock-tos-info-task");
require("./tasks/deploy-lock-tos-task");
require("./tasks/uniswap-v3-approve-erc20-task");
require("./tasks/uniswap-v3-create-pool-task");
require("./tasks/uniswap-v3-increase-liquidity-task");
require("./tasks/uniswap-v3-mint-position-task");
require("./tasks/uniswap-v3-swap-task");
require("./tasks/view-tasks");
require("./tasks/abi-retriever");
require("./tasks/stos-info");
// require("./tasks-rewardprogram/testcase");

// const {
//   RINKEBY_UNISWAP_V3_ACCOUNT_PK1,
//   RINKEBY_UNISWAP_V3_ACCOUNT_PK2,
//   RINKEBY_UNISWAP_V3_ACCOUNT_PK3,
// } = process.env;
// const { ACCOUNT0_PK, ACCOUNT1_PK, TONSTARTER_DEPLOYER_PK } = process.env;

// const { ACCOUNT0_PK, ACCOUNT1_PK, ACCOUNT2_PK } = process.env;

// task("accounts", "Prints the list of accounts", async () => {
//   const accounts = await ethers.getSigners();
//   // const prov = await ethers.getDefaultProvider();
//   const provider = new ethers.providers.JsonRpcProvider();

//   for (const account of accounts) {
//     console.log(account.address);
//     console.log((await provider.getBalance(account.address)).toString());
//   }
// });

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      accounts: {
        count: 5,
      },
      // forking: {
      //   url: `https://mainnet.infura.io/v3/${process.env.InfuraKey}`,
      //   blockNumber: 15125232,
      // },
      forking: {
        url: `https://mainnet.infura.io/v3/${process.env.InfuraKey}`,
        blockNumber: 20424402,
      },
      // forking: {
      //   url: `https://sepolia.infura.io/v3/${process.env.InfuraKey}`,
      //   // blockNumber: 15125232,
      // },
      // forking: {
      //   url: `https://sepolia.infura.io/v3/${process.env.InfuraKey}`,
      //   blockNumber: 6365718,
      // },
    },
    local: {
      url: `http://127.0.0.1:8545/`,
      // accounts: [
      //   `${process.env.ACCOUNT0_PK}`,
      //   `${process.env.ACCOUNT1_PK}`
      // ]
    },
    // rinkeby: {
    //   url: `https://rinkeby.infura.io/v3/${process.env.InfuraKey}`,
    //   accounts: [
    //     `${process.env.ACCOUNT0_PK}`,
    //     `${process.env.ACCOUNT1_PK}`,
    //     `${process.env.ACCOUNT2_PK}`,
    //   ],
    //   gasMultiplier: 1.25, //,
    //   // gasPrice: 20000000000,
    // },
    // mainnet: {
    //   url: `https://mainnet.infura.io/v3/${process.env.InfuraKey}`,
    //   accounts: [`${TONSTARTER_DEPLOYER_PK}`, `${ACCOUNT1_PK}`],
    //   gasMultiplier: 1.25,
    //   gasPrice: 50000000000,
    // },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.InfuraKey}`,
      accounts: [
        `${process.env.ACCOUNT0_PK}`,
        `${process.env.ACCOUNT1_PK}`,
        `${process.env.ACCOUNT2_PK}`,
      ],
      gasMultiplier: 1.25, //,
      // gasPrice: 20000000000,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.InfuraKey}`,
      accounts: [`${process.env.TONSTARTER_DEPLOYER_PK}`],
      // gasMultiplier: 1.25,
      gasPrice: 5000000000,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.InfuraKey}`,
      accounts: [
        `${process.env.ACCOUNT0_PK}`,
        `${process.env.ACCOUNT1_PK}`,
        `${process.env.ACCOUNT2_PK}`,
      ],
    },
    holesky: {
      url: `https://ethereum-holesky.publicnode.com`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      chainId: 17000
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.InfuraKey}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      chainId: 11155111,
    },
    "tokamakGoerli" : {
      url: `https://goerli.optimism.tokamak.network`,
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
  },
  // etherscan: {
  //   apiKey: {
  //     goerli: `${process.env.APIKey}`,
  //     rinkeby: `${process.env.APIKey}`,
  //     mainnet: `${process.env.APIKey}`
  //   }
  // },
  // etherscan: {
  //   apiKey: {
  //     goerli: "YW8HPY4UI4GZAG7CCPNYTSNJ7CPQHGWPCB",
  //   },
  // },
  etherscan: {
    apiKey: {
      mainnet: `${process.env.APIKey}`,
      goerli: `${process.env.APIKey}`,
      titan: "verify",
      titangoerli: "verify",
      holesky: `${process.env.APIKey}`,
      sepolia: `${process.env.APIKey}`,
    } ,
    customChains: [
      {
        network: "titan",
        chainId: 55004,
        urls: {
          apiURL: "https://explorer.titan.tokamak.network//api",
          browserURL: "https://explorer.titan.tokamak.network/"
        }
      },
      {
        network: "titangoerli",
        chainId: 5050,
        urls: {
          apiURL: "https://explorer.titan-goerli.tokamak.network/api",
          browserURL: "https://explorer.titan-goerli.tokamak.network/"
        }
      },
      {
        network: "holesky",
        chainId: 17000,
        urls: {
          apiURL: "https://api-holesky.etherscan.io/api",
          browserURL: "https://holesky.etherscan.io/"
        }
      }
    ]
  },
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
    currency: "KRW",
    gasPrice: 21,
  },
  blockGasLimit: 300000000,
  mocha: {
    timeout: 1000000000,
  },
};
