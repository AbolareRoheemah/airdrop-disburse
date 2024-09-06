import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { MerkleTree } from 'merkletreejs';
import keccak256 from "keccak256";

describe("Airdrop", async function () {
  const claimAddy = "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2";
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  // function to deploy token
  async function deployTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("AirdropToken");
    const token = await Token.deploy();

    return { token, owner, otherAccount };
  }

  // function to deploy airdrop contract
  async function deployAirdropFixture() {
    const [owner, otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4] = await hre.ethers.getSigners();
    const leafNodes = [ owner, otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4].map((addr) =>
      keccak256(ethers.solidityPacked(["address", "uint256"], [otherAccount1.address, ethers.parseUnits("100", 18)]))
    );
    
  
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getHexRoot();
   

    const { token } = await loadFixture(deployTokenFixture);

    const Airdrop = await hre.ethers.getContractFactory("Airdrop");
    const airdrop = await Airdrop.deploy(token, rootHash);

    return { airdrop, owner, otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4, token, rootHash , merkleTree};
  }

  describe("Deployment", function () {
    it("Should check that owner is correct", async function () {
      const { airdrop, owner } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.owner()).to.equal(owner);
    });

    it("Should check that tokenAddress is correctly set", async function () {
      const { airdrop, token } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.tokenAddress()).to.equal(token);
    });

    it("Should check that merkleRoot is correctly set", async function () {
      const { airdrop, rootHash } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.merkleRoot()).to.equal(rootHash);
    });
  });

  describe("Claim", function () {
    it("Should claim successfully", async function () {
      const { airdrop, merkleTree,otherAccount, otherAccount1, token } = await loadFixture(deployAirdropFixture);

      // Transfer erc20 tokens from the owner to contract
      const transferAmount = ethers.parseUnits("250", 18);
      await token.transfer(airdrop, transferAmount);
      expect(await token.balanceOf(airdrop)).to.equal(transferAmount);

      // submit claim
      const claimAmount = ethers.parseUnits("100", 18);
      const leaf = keccak256(ethers.solidityPacked(["address", "uint256"], [otherAccount1.address, claimAmount]));
     
      const proof = merkleTree.getHexProof(leaf);

      // claim amount
      expect(await airdrop.connect(otherAccount1).claim(otherAccount1.address, claimAmount, proof)).to.emit(airdrop, "ClaimSuccessful")
      .withArgs(otherAccount1.address, claimAmount);
      // await airdrop.connect(otherAccount1).claim(otherAccount1.address, claimAmount, proof)

      expect(await token.balanceOf(otherAccount1.address)).to.equal(claimAmount);

      expect( await airdrop.claimed(otherAccount1.address)).to.equal(true);

     const expre =  airdrop.connect(otherAccount1).claim(otherAccount1.address, claimAmount, proof);
     expect(expre).to.be.revertedWith('already claimed');
   
       expect(
         airdrop.connect(otherAccount).claim(claimAddy, claimAmount, proof)
      ).to.be.revertedWith("Cant claim for others");
    });
  });

  describe("updateMerkleRoot", function () {
    it("Should update merkle root correctly", async function() {
      const { airdrop, owner, otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4, token } = await loadFixture(deployAirdropFixture);

      // Create a Merkle Tree for airdrop addresses and amounts
      const leafNodes = [otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4].map((addr) =>
        keccak256(ethers.solidityPacked(["address", "uint256"], [addr.address, ethers.parseUnits("100", 18)]))
      );
      const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
      const rootHash = merkleTree.getHexRoot();

      await airdrop.updateMerkleRoot(rootHash);

      expect(await airdrop.merkleRoot()).to.equal(rootHash)
    })
  })
  describe("ownerWithdraw", function () {
    it("Should withdraw leftover to owner account", async function() {
      const { airdrop, owner, token } = await loadFixture(deployAirdropFixture);

      // trnfer some amount to contract to check it passes
      const transferAmount = ethers.parseUnits("100", 18);
      await token.transfer(airdrop, transferAmount);
      expect(await token.balanceOf(airdrop)).to.equal(transferAmount);

      await airdrop.ownerWithdraw()
      const newBalance = await token.balanceOf(owner)
      expect(await airdrop.getOwnerBalance()).to.equal(newBalance)
    })
  })
});
