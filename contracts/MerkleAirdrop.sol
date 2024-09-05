// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Airdrop {
    address public owner;
    IERC20 public immutable tokenAddress;
    bytes32 public merkleRoot;
    
    mapping (address => bool) public claimed;

    event ClaimSuccessful(address, uint);
    constructor(address _tokenAddress, bytes32 _merkleRoot) {
        owner = msg.sender;
        tokenAddress = IERC20(_tokenAddress);
        merkleRoot = _merkleRoot;
    }

    // function to claim airdrop
    // Accepts an ERC20 token address and the Merkle root as constructor parameters.
    // Allows users to claim their airdrop by providing their address, the amount, and a valid Merkle proof.
    // Verifies the proof against the stored Merkle root.
    // Ensures that users can only claim their airdrop once.
    // Emits an event when a successful claim is made.
    // Provides functions for the contract owner to update the Merkle root and withdraw any remaining tokens 
    // after the airdrop is complete.
    function claim(address user_address, uint _amount, bytes32[] memory _proof) external {
        // check that users claim by themselves
        require(msg.sender == user_address, "Cant claim for others");
        // 
        require(!claimed[user_address], "already claimed");

        // compute leaf hash for provided address and amount
        bytes32 leaf = keccak256(abi.encodePacked(user_address, _amount));

        require(MerkleProof.verify(_proof, merkleRoot, leaf), "Invalid proof");

        claimed[user_address] = true;

        // transfer amount of token to user
        tokenAddress.transfer(user_address, _amount);

        emit ClaimSuccessful(user_address, _amount);
    }

    function onlyOwner() view private {
        require(msg.sender == owner, "unauthorized");
    }

    // function to update merkle root
    function updateMerkleRoot(bytes32 _merkleRoot) external {
        onlyOwner();
        merkleRoot = _merkleRoot;
    }

    // function to withdraw remaining amount by owner
    function ownerWithdraw() external {
        onlyOwner();
        require(tokenAddress.balanceOf(address(this)) > 0, "Insufficient funds");

        // transfer to owner
        tokenAddress.transfer(owner, tokenAddress.balanceOf(address(this)));
    }
}