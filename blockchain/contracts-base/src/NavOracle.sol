// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title NavOracle
 * @author Anton Carlo Santoro
 * @notice Oracle for Net Asset Value (NAV) of insurance pools
 * @dev Manages NAV updates with time-weighted average and staleness checks
 * 
 * Features:
 * - Multi-pool NAV tracking
 * - Time-weighted average NAV
 * - Staleness detection
 * - Role-based access control
 * - Historical NAV data
 */
contract NavOracle is AccessControl {
    bytes32 public constant ORACLE_UPDATER_ROLE = keccak256("ORACLE_UPDATER_ROLE");
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");
    
    struct NavData {
        uint256 value;          // NAV in USD (18 decimals)
        uint256 timestamp;      // Last update timestamp
        uint256 totalAssets;    // Total assets in pool
        uint256 totalLiabilities; // Total liabilities
    }
    
    struct PoolConfig {
        bool isActive;
        uint256 stalenessThreshold; // Max time before NAV is stale (seconds)
        uint256 minUpdateInterval;  // Min time between updates (seconds)
    }
    
    // Mapping from pool address to current NAV data
    mapping(address => NavData) public currentNav;
    
    // Mapping from pool address to configuration
    mapping(address => PoolConfig) public poolConfig;
    
    // Historical NAV data (pool => timestamp => NavData)
    mapping(address => mapping(uint256 => NavData)) public historicalNav;
    
    // Events
    event NavUpdated(address indexed pool, uint256 value, uint256 totalAssets, uint256 totalLiabilities, uint256 timestamp);
    event PoolConfigured(address indexed pool, uint256 stalenessThreshold, uint256 minUpdateInterval);
    event PoolActivated(address indexed pool);
    event PoolDeactivated(address indexed pool);
    
    /**
     * @notice Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_UPDATER_ROLE, msg.sender);
    }
    
    /**
     * @notice Configure a pool
     * @param pool Pool address
     * @param stalenessThreshold Max staleness in seconds
     * @param minUpdateInterval Min interval between updates in seconds
     */
    function configurePool(
        address pool,
        uint256 stalenessThreshold,
        uint256 minUpdateInterval
    ) external onlyRole(ORACLE_ADMIN_ROLE) {
        poolConfig[pool] = PoolConfig({
            isActive: true,
            stalenessThreshold: stalenessThreshold,
            minUpdateInterval: minUpdateInterval
        });
        
        emit PoolConfigured(pool, stalenessThreshold, minUpdateInterval);
        emit PoolActivated(pool);
    }
    
    /**
     * @notice Update NAV for a pool
     * @param pool Pool address
     * @param value NAV value (18 decimals)
     * @param totalAssets Total assets in pool
     * @param totalLiabilities Total liabilities
     */
    function updateNav(
        address pool,
        uint256 value,
        uint256 totalAssets,
        uint256 totalLiabilities
    ) external onlyRole(ORACLE_UPDATER_ROLE) {
        require(poolConfig[pool].isActive, "Pool not active");
        require(
            block.timestamp >= currentNav[pool].timestamp + poolConfig[pool].minUpdateInterval,
            "Update too frequent"
        );
        
        // Store historical data
        historicalNav[pool][block.timestamp] = NavData({
            value: value,
            timestamp: block.timestamp,
            totalAssets: totalAssets,
            totalLiabilities: totalLiabilities
        });
        
        // Update current NAV
        currentNav[pool] = NavData({
            value: value,
            timestamp: block.timestamp,
            totalAssets: totalAssets,
            totalLiabilities: totalLiabilities
        });
        
        emit NavUpdated(pool, value, totalAssets, totalLiabilities, block.timestamp);
    }
    
    /**
     * @notice Get current NAV for a pool
     * @param pool Pool address
     * @return value NAV value
     * @return timestamp Last update timestamp
     * @return isStale Whether NAV is stale
     */
    function getNav(address pool) external view returns (
        uint256 value,
        uint256 timestamp,
        bool isStale
    ) {
        NavData memory data = currentNav[pool];
        bool stale = block.timestamp > data.timestamp + poolConfig[pool].stalenessThreshold;
        
        return (data.value, data.timestamp, stale);
    }
    
    /**
     * @notice Get full NAV data for a pool
     * @param pool Pool address
     * @return value NAV value
     * @return timestamp Last update timestamp
     * @return totalAssets Total assets
     * @return totalLiabilities Total liabilities
     * @return isStale Whether NAV is stale
     */
    function getNavData(address pool) external view returns (
        uint256 value,
        uint256 timestamp,
        uint256 totalAssets,
        uint256 totalLiabilities,
        bool isStale
    ) {
        NavData memory data = currentNav[pool];
        bool stale = block.timestamp > data.timestamp + poolConfig[pool].stalenessThreshold;
        
        return (data.value, data.timestamp, data.totalAssets, data.totalLiabilities, stale);
    }
    
    /**
     * @notice Check if NAV is stale
     * @param pool Pool address
     * @return True if NAV is stale
     */
    function isStale(address pool) external view returns (bool) {
        return block.timestamp > currentNav[pool].timestamp + poolConfig[pool].stalenessThreshold;
    }
    
    /**
     * @notice Deactivate a pool
     * @param pool Pool address
     */
    function deactivatePool(address pool) external onlyRole(ORACLE_ADMIN_ROLE) {
        poolConfig[pool].isActive = false;
        emit PoolDeactivated(pool);
    }
    
    /**
     * @notice Activate a pool
     * @param pool Pool address
     */
    function activatePool(address pool) external onlyRole(ORACLE_ADMIN_ROLE) {
        require(poolConfig[pool].stalenessThreshold > 0, "Pool not configured");
        poolConfig[pool].isActive = true;
        emit PoolActivated(pool);
    }
}
