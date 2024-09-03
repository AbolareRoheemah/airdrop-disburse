import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const { token } = await loadFixture(deployTokenFixture);

    const airdropInst = await hre.ethers.getContractFactory("Airdrop");
    const airdrop = await airdropInst.deploy(token);

    return { airdrop, owner, otherAccount, token };
  }

  describe("Deployment", function () {
    const merkle_root = "0x3d599af7d11baeefcf8c0b4c1570e38d1591a1573590f62a037489649a51dc9b";
    it("Should check that owner is correct", async function () {
      const { airdrop, owner } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.owner()).to.equal(owner);
    });

    it("Should check that tokenAddress is correctly set", async function () {
      const { airdrop, token } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.tokenAddress()).to.equal(token);
    });

    it("Should check that merkleRoot is correctly set", async function () {
      const { airdrop } = await loadFixture(deployAirdropFixture);

      expect(await airdrop.merkleRoot()).to.equal(merkle_root);
    });
  });

  describe("Claim", function () {
    it("Should claim successfully", async function () {
      const { airdrop, owner, otherAccount, token } = await loadFixture(deployAirdropFixture);

      // Transfer erc20 tokens from the owner to otherAccount
      const _user = "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2"
      const claimAmount = ethers.parseUnits("150", 18);
      await token.transfer(airdrop, claimAmount);
      expect(await token.balanceOf(airdrop)).to.equal(claimAmount);

      // using otherAccount to approve the SaveErc20 contract to spend token
      await token.connect(otherAccount).approve(saveErc20, trfAmount);

      const otherAccountBalBefore = await token.balanceOf(otherAccount);

      const depositAmount = ethers.parseUnits("10", 18);

      // Using the otherAccount to call the deposit function
      await saveErc20.connect(otherAccount).deposit(depositAmount);

      expect(await token.balanceOf(otherAccount)).to.equal(otherAccountBalBefore - depositAmount);

      expect(await saveErc20.connect(otherAccount).myBalance()).to.equal(depositAmount);
      expect(await saveErc20.getContractBalance()).to.equal(depositAmount);
    });

    it("Should emit an event after successful claim", async function () {
      const { saveErc20, otherAccount, token } = await loadFixture(deploySaveERC20);

      const trfAmount = ethers.parseUnits("100", 18);
      await token.transfer(otherAccount, trfAmount);

      await token.connect(otherAccount).approve(saveErc20, trfAmount);

      const depositAmount = ethers.parseUnits("10", 18);

      await expect(saveErc20.connect(otherAccount).deposit(depositAmount))
        .to.emit(saveErc20, "DepositSuccessful")
        .withArgs(otherAccount.address, depositAmount);
    });


    it("Should revert on zero deposit", async function () {
      const { saveErc20, otherAccount, token } = await loadFixture(deploySaveERC20);

      const depositAmount = ethers.parseUnits("0", 18);

      await expect(
        saveErc20.connect(otherAccount).deposit(depositAmount)
      ).to.be.revertedWithCustomError(saveErc20, "ZeroValueNotAllowed");
    });
  });
});
