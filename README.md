# Airdrop DApp

A decentralized app to aid disbursement of airdrop to qualified beneficiaries. It makes use of a merkle tree to store and verify addresses and their entitled amount. This ensures users only claim their entitle amount and can only claim once.

## Table of Content
1. [Prerequisites](#Prerequisites)
2. [Setting up and running merkle ts script](#setting-up-and-running-merkle-ts-script)
3. [Deploying the airdrop contract](#deploying-the-airdrop-contract)
4. [Generating proofs to claim airdrop](#generating-proofs-to-claim-airdrop)
5. [Assumptions or limitations](#assumptions-or-limitations)

## Prerequisites
- [Nodejs](https://nodejs.org/en/download/)
- [Hardhat](https://hardhat.org/getting-started/)
- [Typescript](https://www.npmjs.com/package/typescript) (installed as dev depencies)
- [Ethersjs](https://docs.ethers.io/v6/)
- [Openzeppelin Contracts](https://docs.openzeppelin.com/contracts/4.x/)
- [@openzeppelin/merkle-tree](https://github.com/OpenZeppelin/merkle-tree)
- [MerkleTree.js](https://www.npmjs.com/package/merkletreejs)
- [csv-parse](https://www.npmjs.com/package/csv-parser)

## Setting up and running merkle.ts script

- **Setting up**
1. **Clone the repository**
```
git clone https://github.com/AbolareRoheemah/airdrop-disburse.git
cd airdrop-disburse
```
2. **Install Dependencies**
```
npm install
```

- **Running merkle.ts file**
The merkle.ts script contains code that generates a merkle tree based on a list of airdrop beneficiaries represented by their address and entitled amount. This merkle tree is then used to verify if a leaf (in this case an address, amount pair) is a valid leaf in the merkle tree. Before users can claim their airdrop, they must obtain a proof from the merkle.ts file. Key steps in the file are as follows:

1. Put your csv file in the project folder and provide the correct path to it in your merkle.ts file. The CSV file must be in this format:

```
address,amount
0xf3....2266,1400
0x70....79C8,1300
0x3C....93BC,1200
```
2. Run the merkle.ts file using the command below:

```
npx hardhat run scripts/merkle.ts
```
The file logs the merkle root and the proof generated for the test address placed there. Getting proof for your desired address will be covered later in [Generating proofs to claim airdrop](#generating-proofs-to-claim-airdrop).

## Deploying the airdrop contract
- **Configurations**
I will be deploying this contract on Lisk Sepolia. To configure your hardhat project to deploy on Lisk Sepolia, follow the steps below:
1. Get Private key of the account you want to use to deploy and keep it in your .env file or save it as a variable using hardhat by running:

```
npx hardhat vars set ACCOUNT_PRIVATE_KEY 
```
2. Set the lisk RPC url also either in the .env file or use hardhat. Run:
```
npx hardhat vars set LISK_RPC_URL
```
3. Configure your project settings to deploy on lisk. Add the followng to your hardhat.config.ts:
```
import { vars } from "hardhat/config";
const rpcUrl = vars.get("LISK_RPC_URL")
const privateKey = vars.get("ACCOUNT_PRIVATE_KEY")
```
4. In the same hardhat config file, add settings for "lisk-sepolia" inside the networks object
```
networks: {
    "lisk-sepolia": {
        url: rpcUrl,
        accounts: [privateKey],
        gasPrice: 1000000000,
    },
}
```
5. Also add the following:
```
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
```
- **Deploy the ERC20 token contract**
The airdrop contract requires that a token address be passed to it as a constructor argument, together with the merkle root generated from previous steps. Create a 'Token.ts' file in the ignition/modules path and put the following lines in the file:
```
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AirdropToken = buildModule("AirdropTokenModule", (m) => {
  const airdropToken = m.contract("AirdropToken");

  return { airdropToken };
});

export default AirdropToken;
});

export default AirdropToken;
```
To deploy the ERC20 token, run the following command:
```
npx hardhat ignition deploy ./ignition/modules/Token.ts --network lisk-sepolia
```
**Deploy the airdrop contract**
1. Create another file named 'Airdrop.ts' in the ignition/modules path and put the following lines in the file:
```
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
const tokenAddress = "YourTokenAddress"; // Replace with deployed token contract address
const merkleRoot = "YourMerkleRoot"; // Replace with generated Merkle root

const AirdropContract = buildModule("AirdropContract", (m) => {
	const airdrop = m.contract("Airdrop", [tokenAddress, merkleRoot]);

	return { airdrop };
});

export default AirdropContract;
```
2. Run the following command to deploy and verify the contract on lisk-sepolia:
```
npx hardhat ignition deploy ./ignition/modules/Airdrop.ts --network lisk-sepolia --verify
```

## Generating proofs to claim airdrop
To call the function to claim airdrop, a user needs to submit a merkle proof along with their address and the amount they are entitled to. Obtaining proof for a particular address is simple.
1. In the merkle.ts file, you'll find an object named "targetEntry". Replace the address and amount fields there with the correct claim address and amount.
2. Run:
```
npx hardhat run scripts/merkle.ts
```
This logs the merkleRoot and proof for the provided address to the console.
3. Finally, head to your deployed airdrop contract and call the 'claim' function using the proof you just generated. If everything goes well, you should see a 'ClaimSuccessful' event logged in the console.

## Assumptions or limitations
1. The guide assumes that the person that wants to claim the airdrop is the one calling the claim function. Therefore there is a constraint set to only allow calls from the claim address pass.
2. This contract requires some hands-on tasks to get it running. This guide assumes the user is familiar with devlopment on hardhat
3. This guide assumes the address whose private key would be used for deployment has test Lisk for deployment.

