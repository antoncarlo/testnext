// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NXBToken
 * @author Anton Carlo Santoro
 * @notice NextBlock Governance Token (ERC-20)
 * @dev Standard ERC-20 token with burn, permit and ownership capabilities
 * 
 * Token Details:
 * - Name: NextBlock
 * - Symbol: NXB
 * - Decimals: 18
 * - Max Supply: 1,000,000,000 NXB (1 billion)
 * 
 * Features:
 * - Burnable: Holders can burn their tokens
 * - Permit: EIP-2612 gasless approvals
 * - Ownable: Owner can mint tokens (up to max supply)
 */
contract NXBToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion NXB
    
    /**
     * @notice Constructor that mints initial supply to deployer
     * @param initialSupply Initial supply to mint (in wei units)
     */
    constructor(uint256 initialSupply) 
        ERC20("NextBlock", "NXB") 
        ERC20Permit("NextBlock")
        Ownable(msg.sender)
    {
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds max supply");
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @notice Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Minting would exceed max supply");
        _mint(to, amount);
    }
    
    /**
     * @notice Get the maximum supply of NXB tokens
     * @return Maximum supply in wei units
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}
