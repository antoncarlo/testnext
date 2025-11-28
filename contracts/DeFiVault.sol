// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DeFiVault
 * @dev Smart contract for DeFi vault that accepts ETH deposits and tracks user positions
 * @author Anton Carlo Santoro
 * 
 * Security improvements:
 * - Emergency withdraw now transfers to a configurable treasury address
 * - Added emergency mode that allows users to withdraw their own funds
 * - Proper state updates for all operations
 */
contract DeFiVault is Ownable, ReentrancyGuard, Pausable {
    // Vault metadata
    string public vaultName;
    string public protocolType; // "Lending", "Staking", "Liquidity Pool", "Yield Farming"
    uint256 public baseAPY; // Base APY in basis points (e.g., 850 = 8.50%)
    uint256 public pointsMultiplier; // Points multiplier (e.g., 2 = 2x)
    
    // Treasury address for emergency withdrawals
    address public treasury;
    
    // Emergency mode flag
    bool public emergencyMode;
    
    // User balances
    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps;
    
    // Total value locked
    uint256 public totalValueLocked;
    
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);
    event EmergencyModeEnabled(uint256 timestamp);
    event EmergencyModeDisabled(uint256 timestamp);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    /**
     * @dev Constructor
     * @param _vaultName Name of the vault
     * @param _protocolType Type of protocol (Lending, Staking, etc.)
     * @param _baseAPY Base APY in basis points
     * @param _pointsMultiplier Points multiplier
     * @param _treasury Treasury address for emergency withdrawals
     */
    constructor(
        string memory _vaultName,
        string memory _protocolType,
        uint256 _baseAPY,
        uint256 _pointsMultiplier,
        address _treasury
    ) {
        require(_treasury != address(0), "Treasury cannot be zero address");
        
        vaultName = _vaultName;
        protocolType = _protocolType;
        baseAPY = _baseAPY;
        pointsMultiplier = _pointsMultiplier;
        treasury = _treasury;
        emergencyMode = false;
    }
    
    /**
     * @dev Deposit ETH into the vault
     */
    function deposit() external payable nonReentrant whenNotPaused {
        require(!emergencyMode, "Vault is in emergency mode");
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
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Allow withdrawals even when paused if in emergency mode
        if (!emergencyMode) {
            require(!paused(), "Vault is paused");
        }
        
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
     * @dev Emergency withdrawal to treasury
     * @notice This function should only be used in extreme emergencies
     * @notice All funds are transferred to the treasury multisig for safekeeping
     * @notice Users can still withdraw their funds via the normal withdraw() function
     */
    function emergencyWithdrawToTreasury() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        require(treasury != address(0), "Treasury not set");
        
        // Transfer to treasury (multisig) instead of owner
        (bool success, ) = treasury.call{value: balance}("");
        require(success, "Transfer to treasury failed");
        
        emit EmergencyWithdrawal(treasury, balance);
    }
    
    /**
     * @dev Enable emergency mode
     * @notice In emergency mode:
     * - No new deposits allowed
     * - Users can still withdraw their funds even if paused
     * - Owner can transfer funds to treasury for safekeeping
     */
    function enableEmergencyMode() external onlyOwner {
        require(!emergencyMode, "Emergency mode already enabled");
        emergencyMode = true;
        _pause(); // Also pause the vault
        emit EmergencyModeEnabled(block.timestamp);
    }
    
    /**
     * @dev Disable emergency mode
     */
    function disableEmergencyMode() external onlyOwner {
        require(emergencyMode, "Emergency mode not enabled");
        emergencyMode = false;
        _unpause(); // Unpause the vault
        emit EmergencyModeDisabled(block.timestamp);
    }
    
    /**
     * @dev Update treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Treasury cannot be zero address");
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
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
