import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
const tokenAddress = "0x5792b150eF317dF9444879F006985979c6d25943"; // Replace with deployed token contract address
const merkleRoot = "0x3d599af7d11baeefcf8c0b4c1570e38d1591a1573590f62a037489649a51dc9b"; // Replace with generated Merkle root

const AirdropContract = buildModule("AirdropContract", (m) => {
	const airdrop = m.contract("Airdrop", [tokenAddress, merkleRoot]);

	return { airdrop };
});

export default AirdropContract;