// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title InsurancePoolToken
 * @author Anton Carlo Santoro
 * @notice Security Token for tokenized insurance pools (ERC-1400/3643 compliant)
 * @dev Implements basic security token features with transfer restrictions
 * 
 * Features:
 * - Transfer restrictions (whitelist required)
 * - Partition management for different tranches
 * - Pausable transfers
 * - Role-based access control
 * - Compliance layer for KYC/AML
 */
contract InsurancePoolToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Whitelist for compliant addresses
    mapping(address => bool) public whitelist;
    
    // Partition balances for different tranches
    mapping(bytes32 => mapping(address => uint256)) public partitionBalances;
    
    // Events
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event PartitionTransfer(bytes32 indexed partition, address indexed from, address indexed to, uint256 value);
    
    /**
     * @notice Constructor
     * @param name Token name
     * @param symbol Token symbol
     */
    constructor(string memory name, string memory symbol) 
        ERC20(name, symbol) 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        // Whitelist deployer
        whitelist[msg.sender] = true;
    }
    
    /**
     * @notice Add address to whitelist
     * @param account Address to whitelist
     */
    function addToWhitelist(address account) external onlyRole(COMPLIANCE_ROLE) {
        whitelist[account] = true;
        emit AddressWhitelisted(account);
    }
    
    /**
     * @notice Remove address from whitelist
     * @param account Address to remove
     */
    function removeFromWhitelist(address account) external onlyRole(COMPLIANCE_ROLE) {
        whitelist[account] = false;
        emit AddressRemovedFromWhitelist(account);
    }
    
    /**
     * @notice Mint tokens to address
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(whitelist[to], "Recipient not whitelisted");
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens from address
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
    
    /**
     * @notice Pause all transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause all transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Transfer tokens by partition
     * @param partition Partition identifier
     * @param to Recipient address
     * @param value Amount to transfer
     */
    function transferByPartition(
        bytes32 partition,
        address to,
        uint256 value
    ) external whenNotPaused returns (bytes32) {
        require(whitelist[msg.sender], "Sender not whitelisted");
        require(whitelist[to], "Recipient not whitelisted");
        require(partitionBalances[partition][msg.sender] >= value, "Insufficient partition balance");
        
        partitionBalances[partition][msg.sender] -= value;
        partitionBalances[partition][to] += value;
        
        emit PartitionTransfer(partition, msg.sender, to, value);
        
        return partition;
    }
    
    /**
     * @notice Get partition balance
     * @param partition Partition identifier
     * @param account Address to check
     * @return Balance in partition
     */
    function balanceOfByPartition(bytes32 partition, address account) external view returns (uint256) {
        return partitionBalances[partition][account];
    }
    
    /**
     * @notice Override transfer to add compliance checks
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(whitelist[from], "Sender not whitelisted");
            require(whitelist[to], "Recipient not whitelisted");
        }
        super._update(from, to, value);
    }
}
