// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DeFiVault
 * @dev Smart contract for DeFi vault that accepts ETH deposits and tracks user positions
 */
contract DeFiVault is Ownable, ReentrancyGuard, Pausable {
    // Vault metadata
    string public vaultName;
    string public protocolType; // "Lending", "Staking", "Liquidity Pool", "Yield Farming"
    uint256 public baseAPY; // Base APY in basis points (e.g., 850 = 8.50%)
    uint256 public pointsMultiplier; // Points multiplier (e.g., 2 = 2x)
    
    // User balances
    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps;
    
    // Total value locked
    uint256 public totalValueLocked;
    
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    event EmergencyWithdrawal(address indexed user, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _vaultName Name of the vault
     * @param _protocolType Type of protocol (Lending, Staking, etc.)
     * @param _baseAPY Base APY in basis points
     * @param _pointsMultiplier Points multiplier
     */
    constructor(
        string memory _vaultName,
        string memory _protocolType,
        uint256 _baseAPY,
        uint256 _pointsMultiplier
    ) {
        vaultName = _vaultName;
        protocolType = _protocolType;
        baseAPY = _baseAPY;
        pointsMultiplier = _pointsMultiplier;
    }
    
    /**
     * @dev Deposit ETH into the vault
     */
    function deposit() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        balances[msg.sender] += msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        totalValueLocked += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev Withdraw ETH from the vault
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        totalValueLocked -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Get user balance
     * @param user User address
     * @return User balance
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    /**
     * @dev Get deposit timestamp
     * @param user User address
     * @return Deposit timestamp
     */
    function getDepositTimestamp(address user) external view returns (uint256) {
        return depositTimestamps[user];
    }
    
    /**
     * @dev Emergency withdrawal by owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdrawal(owner(), balance);
    }
    
    /**
     * @dev Pause the vault
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the vault
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {
        revert("Use deposit() function");
    }
}
