// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title KycWhitelist
 * @author Anton Carlo Santoro
 * @notice KYC Whitelist management for NextBlock platform
 * @dev Manages whitelisted addresses with KYC verification levels
 * 
 * Features:
 * - Multi-level KYC verification (Basic, Enhanced, Institutional)
 * - Expiration dates for KYC status
 * - Role-based access control
 * - Batch operations support
 */
contract KycWhitelist is AccessControl {
    bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN_ROLE");
    bytes32 public constant KYC_VERIFIER_ROLE = keccak256("KYC_VERIFIER_ROLE");
    
    enum KycLevel {
        None,           // 0 - Not verified
        Basic,          // 1 - Basic KYC (retail)
        Enhanced,       // 2 - Enhanced KYC (accredited)
        Institutional   // 3 - Institutional KYC
    }
    
    struct KycData {
        KycLevel level;
        uint256 expirationDate;
        bool isActive;
    }
    
    // Mapping from address to KYC data
    mapping(address => KycData) public kycData;
    
    // Events
    event KycApproved(address indexed account, KycLevel level, uint256 expirationDate);
    event KycRevoked(address indexed account);
    event KycLevelUpdated(address indexed account, KycLevel oldLevel, KycLevel newLevel);
    
    /**
     * @notice Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @notice Approve KYC for an address
     * @param account Address to approve
     * @param level KYC level to assign
     * @param expirationDate Expiration timestamp (0 for no expiration)
     */
    function approveKyc(
        address account,
        KycLevel level,
        uint256 expirationDate
    ) external onlyRole(KYC_VERIFIER_ROLE) {
        require(account != address(0), "Invalid address");
        require(level != KycLevel.None, "Invalid KYC level");
        
        kycData[account] = KycData({
            level: level,
            expirationDate: expirationDate,
            isActive: true
        });
        
        emit KycApproved(account, level, expirationDate);
    }
    
    /**
     * @notice Revoke KYC for an address
     * @param account Address to revoke
     */
    function revokeKyc(address account) external onlyRole(KYC_ADMIN_ROLE) {
        kycData[account].isActive = false;
        emit KycRevoked(account);
    }
    
    /**
     * @notice Update KYC level for an address
     * @param account Address to update
     * @param newLevel New KYC level
     */
    function updateKycLevel(
        address account,
        KycLevel newLevel
    ) external onlyRole(KYC_VERIFIER_ROLE) {
        require(kycData[account].isActive, "KYC not active");
        
        KycLevel oldLevel = kycData[account].level;
        kycData[account].level = newLevel;
        
        emit KycLevelUpdated(account, oldLevel, newLevel);
    }
    
    /**
     * @notice Batch approve KYC for multiple addresses
     * @param accounts Array of addresses to approve
     * @param level KYC level to assign to all
     * @param expirationDate Expiration timestamp for all
     */
    function batchApproveKyc(
        address[] calldata accounts,
        KycLevel level,
        uint256 expirationDate
    ) external onlyRole(KYC_VERIFIER_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            kycData[accounts[i]] = KycData({
                level: level,
                expirationDate: expirationDate,
                isActive: true
            });
            
            emit KycApproved(accounts[i], level, expirationDate);
        }
    }
    
    /**
     * @notice Check if address is KYC approved
     * @param account Address to check
     * @return True if KYC is active and not expired
     */
    function isKycApproved(address account) external view returns (bool) {
        KycData memory data = kycData[account];
        
        if (!data.isActive) return false;
        if (data.level == KycLevel.None) return false;
        if (data.expirationDate > 0 && block.timestamp > data.expirationDate) return false;
        
        return true;
    }
    
    /**
     * @notice Check if address has minimum KYC level
     * @param account Address to check
     * @param minLevel Minimum required level
     * @return True if account has at least minLevel
     */
    function hasMinimumKycLevel(address account, KycLevel minLevel) external view returns (bool) {
        KycData memory data = kycData[account];
        
        if (!data.isActive) return false;
        if (data.expirationDate > 0 && block.timestamp > data.expirationDate) return false;
        
        return uint8(data.level) >= uint8(minLevel);
    }
    
    /**
     * @notice Get KYC data for an address
     * @param account Address to query
     * @return level KYC level
     * @return expirationDate Expiration timestamp
     * @return isActive Whether KYC is active
     */
    function getKycData(address account) external view returns (
        KycLevel level,
        uint256 expirationDate,
        bool isActive
    ) {
        KycData memory data = kycData[account];
        return (data.level, data.expirationDate, data.isActive);
    }
}
