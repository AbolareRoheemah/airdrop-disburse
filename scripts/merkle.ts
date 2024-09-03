import fs from "fs";
import csv from 'csv-parser';
import { ethers } from "hardhat";
import { MerkleTree } from 'merkletreejs';
import keccak256 from "keccak256";

const csvFile = 'csv/users.csv';
// let leafNodesData = (data: {address: string; amount: string}): Buffer => keccak256(
//     ethers.solidityPacked(['address', 'uint256'], [data.address, data.amount])
// );

let res: Buffer[] = []

fs.createReadStream(csvFile)
.pipe(csv())
.on("data", (row: { address: string; amount: number }) => {
    const address = row.address;
	const amount = ethers.parseUnits(row.amount.toString(), 18);

    const leaf = keccak256(
        ethers.solidityPacked(["address", "uint256"], [address, amount])
    );

    res.push(leaf);
})
.on("end", () => {
    // const leaves = res.map((data) => leafNodesData(data))

    const merkleTree = new MerkleTree(res, keccak256, {
        sortPairs: true,
    });

    const rootHash = merkleTree.getHexRoot();
    console.log("Merkle Root:", rootHash);

    // Extracting proof for this address ["0xd9f6434e4a9834e8e0ccda9eae02cf63e04feeff96002323ee17ea7bb073569c","0x540cfc25d77baa5129daef6cb11fb218340bc5d27b372cdd446b32485ab48c69","0xff3a2998220cbc4c1e8d3bf250d11c1a36df2f19b7dd4607790937beff83647f"]
    const targetEntry = {
        address: "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
        amount: ethers.parseUnits("105", 18)
    }
    // const targetLeaf = leafNodesData(targetEntry)
    const leaf = keccak256(
        ethers.solidityPacked(["address", "uint256"], [targetEntry.address, targetEntry.amount])
    );

    const proof = merkleTree.getHexProof(leaf);
    console.log("Proof:", proof);

    // verify
    const isAuthentic = merkleTree.verify(proof, leaf, rootHash)
    console.log("Verify:", isAuthentic);
})
//Merkle Root: 0x3d599af7d11baeefcf8c0b4c1570e38d1591a1573590f62a037489649a51dc9b
// Proof: [
//     '0xd9f6434e4a9834e8e0ccda9eae02cf63e04feeff96002323ee17ea7bb073569c',
//     '0x540cfc25d77baa5129daef6cb11fb218340bc5d27b372cdd446b32485ab48c69',
//     '0xff3a2998220cbc4c1e8d3bf250d11c1a36df2f19b7dd4607790937beff83647f'
//   ]
    