import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

// Ensure we have required environment variables
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// Make environment variables optional for local development
// if (!SEPOLIA_RPC_URL || !PRIVATE_KEY || !ETHERSCAN_API_KEY) {
//   throw new Error("Missing required environment variables. Check .env file.");
// }

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Only include Sepolia if environment variables are available
    ...(SEPOLIA_RPC_URL && PRIVATE_KEY ? {
      sepolia: {
        url: SEPOLIA_RPC_URL,
        accounts: [PRIVATE_KEY],
        chainId: 11155111,
      }
    } : {}),
  },
  // Only include Etherscan if API key is available
  ...(ETHERSCAN_API_KEY ? {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY,
    }
  } : {}),
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
