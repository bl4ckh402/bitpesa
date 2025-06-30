import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "dotenv/config";

// Get environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const AVALANCHE_FUJI_RPC_URL = process.env.AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const AVALANCHE_MAINNET_RPC_URL = process.env.AVALANCHE_MAINNET_RPC_URL || "https://api.avax.network/ext/bc/C/rpc";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    avalancheFuji: {
      url: AVALANCHE_FUJI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 43113,
      verify: {
        etherscan: {
          apiUrl: "https://api-testnet.snowscan.xyz/api",
          apiKey: process.env.SNOWTRACE_API_KEY || "",
        },
      },
    },
    avalanche: {
      url: AVALANCHE_MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 43114,
      verify: {
        etherscan: {
          apiUrl: "https://api.snowscan.xyz/api",
          apiKey: process.env.SNOWTRACE_API_KEY || "",
        },
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      avalancheFuji: process.env.SNOWTRACE_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
    },
    customChains: [
      {
        network: "avalancheFuji",
        chainId: 43113,
        urls: {
          apiURL: "https://api-testnet.snowscan.xyz/api",
          browserURL: "https://testnet.snowscan.xyz/",
        },
      },
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.snowscan.xyz/api",
          browserURL: "https://snowscan.xyz/",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
