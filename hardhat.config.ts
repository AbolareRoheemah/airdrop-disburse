import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const rpcUrl = vars.get("LISK_RPC_URL")
const privateKey = vars.get("ACCOUNT_PRIVATE_KEY")

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    "lisk-sepolia": {
      url: rpcUrl,
      accounts: [privateKey],
      gasPrice: 1000000000,
  },
},
  etherscan: {
    // Use "123" as a placeholder, because Blockscout doesn't need a real API key, and Hardhat will complain if this property isn't set.
    apiKey: {
        "lisk-sepolia": "123",
    },
    customChains: [
        {
            network: "lisk-sepolia",
            chainId: 4202,
            urls: {
                apiURL: "https://sepolia-blockscout.lisk.com/api",
                browserURL: "https://sepolia-blockscout.lisk.com/",
            },
        },
    ],
  }
};

export default config;
