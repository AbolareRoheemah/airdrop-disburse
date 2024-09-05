import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { MerkleTree } from 'merkletreejs';
import keccak256 from "keccak256";

describe("Airdrop", function () {
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
    const merkle_root = "0x3d599af7d11baeefcf8c0b4c1570e38d1591a1573590f62a037489649a51dc9b";
    const [owner, otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4] = await hre.ethers.getSigners();

    const { token } = await loadFixture(deployTokenFixture);

    const Airdrop = await hre.ethers.getContractFactory("Airdrop");
    const airdrop = await Airdrop.deploy(token, merkle_root);

    return { airdrop, owner, otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4, token, merkle_root };
  }

  describe("Deployment", function () {
    it("Should check that owner is correct", async function () {
      const { airdrop, owner } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.owner()).to.equal(owner);
    });

    it("Should check that tokenAddress is correctly set", async function () {
      const { airdrop, owner, token, merkle_root } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.tokenAddress()).to.equal(token);
    });

    it("Should check that merkleRoot is correctly set", async function () {
      const { airdrop, merkle_root } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.merkleRoot()).to.equal(merkle_root);
    });
  });

  describe("Claim", function () {
    it("Should claim successfully", async function () {
      const { airdrop, owner, otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4, token } = await loadFixture(deployAirdropFixture);

      // Create a Merkle Tree for airdrop addresses and amounts
      const leafNodes = [otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4].map((addr) =>
        keccak256(ethers.solidityPacked(["address", "uint256"], [addr.address, ethers.parseUnits("100", 18)]))
      );
      const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
      const rootHash = merkleTree.getHexRoot();

      // Transfer erc20 tokens from the owner to contract
      const transferAmount = ethers.parseUnits("250", 18);
      await token.transfer(airdrop, transferAmount);
      expect(await token.balanceOf(airdrop)).to.equal(transferAmount);

      // submit claim
      const claimAddy = otherAccount1.address
      const claimAmount = ethers.parseUnits("100", 18);
      const leaf = keccak256(ethers.solidityPacked(["address", "uint256"], [claimAddy, claimAmount]));
      const proof = merkleTree.getHexProof(leaf);
      const isAuthentic = merkleTree.verify(proof, leaf, rootHash);

      expect(await isAuthentic).to.equal(true)

      // send claim amount
      await airdrop.connect(otherAccount1).claim(claimAddy, claimAmount, proof)

      expect(await token.balanceOf(claimAddy)).to.equal(claimAmount);

      expect(await airdrop.claimed(claimAddy)).to.equal(true);

      expect(await airdrop.connect(otherAccount1).claim(claimAddy, claimAmount, proof)).to.emit(airdrop, "ClaimSuccessful")
      .withArgs(otherAccount1.address, claimAddy);

      expect(
        await airdrop.connect(otherAccount).claim(claimAddy, claimAmount, proof)
      ).to.be.revertedWith("Cant claim for others");

      expect(await airdrop.connect(otherAccount1).claim(claimAddy, claimAmount, proof)).to.be.rejectedWith("already claimed");

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
      const { airdrop, owner, otherAccount, otherAccount1, otherAccount2, otherAccount3, otherAccount4, token } = await loadFixture(deployAirdropFixture);

      const balanceBefore = token.balanceOf(owner)
      await airdrop.ownerWithdraw()
      const balanceAfter = token.balanceOf(owner)

      expect(await token.balanceOf(owner)).to.equal(balanceAfter)
    })
  })
});
