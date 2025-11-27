// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleVault
 * @dev Simplified DeFi vault without external dependencies
 */
contract SimpleVault {
    // Vault metadata
    string public vaultName;
    string public protocolType;
    uint256 public baseAPY;
    uint256 public pointsMultiplier;
    address public owner;
    
    // User balances
    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps;
    
    // Total value locked
    uint256 public totalValueLocked;
    
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
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
        owner = msg.sender;
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Amount must be > 0");
        
        balances[msg.sender] += msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        totalValueLocked += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
    
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        totalValueLocked -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, amount, block.timestamp);
    }
    
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    function getDepositTimestamp(address user) external view returns (uint256) {
        return depositTimestamps[user];
    }
    
    receive() external payable {
        revert("Use deposit()");
    }
}
