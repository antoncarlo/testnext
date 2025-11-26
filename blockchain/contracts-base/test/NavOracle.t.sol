// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NavOracle.sol";

contract NavOracleTest is Test {
    NavOracle public oracle;
    address public admin;
    address public updater;
    address public pool1;
    address public pool2;
    
    uint256 constant STALENESS_THRESHOLD = 1 hours;
    uint256 constant MIN_UPDATE_INTERVAL = 5 minutes;
    
    function setUp() public {
        admin = address(this);
        updater = address(0x1);
        pool1 = address(0x2);
        pool2 = address(0x3);
        
        oracle = new NavOracle();
        oracle.grantRole(oracle.ORACLE_UPDATER_ROLE(), updater);
    }
    
    function testConfigurePool() public {
        oracle.configurePool(pool1, STALENESS_THRESHOLD, MIN_UPDATE_INTERVAL);
        
        (bool isActive, uint256 stalenessThreshold, uint256 minUpdateInterval) = oracle.poolConfig(pool1);
        assertTrue(isActive);
        assertEq(stalenessThreshold, STALENESS_THRESHOLD);
        assertEq(minUpdateInterval, MIN_UPDATE_INTERVAL);
    }
    
    function testUpdateNav() public {
        oracle.configurePool(pool1, STALENESS_THRESHOLD, MIN_UPDATE_INTERVAL);
        
        uint256 navValue = 1000 * 10**18;
        uint256 totalAssets = 10000 * 10**18;
        uint256 totalLiabilities = 9000 * 10**18;
        
        vm.prank(updater);
        oracle.updateNav(pool1, navValue, totalAssets, totalLiabilities);
        
        (uint256 value, uint256 timestamp, bool isStale) = oracle.getNav(pool1);
        assertEq(value, navValue);
        assertEq(timestamp, block.timestamp);
        assertFalse(isStale);
    }
    
    function testNavStaleness() public {
        oracle.configurePool(pool1, STALENESS_THRESHOLD, MIN_UPDATE_INTERVAL);
        
        vm.prank(updater);
        oracle.updateNav(pool1, 1000 * 10**18, 10000 * 10**18, 9000 * 10**18);
        
        // Fast forward past staleness threshold
        vm.warp(block.timestamp + STALENESS_THRESHOLD + 1);
        
        (,, bool isStale) = oracle.getNav(pool1);
        assertTrue(isStale);
    }
    
    function testMinUpdateInterval() public {
        oracle.configurePool(pool1, STALENESS_THRESHOLD, MIN_UPDATE_INTERVAL);
        
        vm.startPrank(updater);
        oracle.updateNav(pool1, 1000 * 10**18, 10000 * 10**18, 9000 * 10**18);
        
        // Try to update too soon
        vm.expectRevert("Update too frequent");
        oracle.updateNav(pool1, 1100 * 10**18, 11000 * 10**18, 9900 * 10**18);
        
        // Fast forward past min interval
        vm.warp(block.timestamp + MIN_UPDATE_INTERVAL);
        oracle.updateNav(pool1, 1100 * 10**18, 11000 * 10**18, 9900 * 10**18);
        
        vm.stopPrank();
    }
    
    function testDeactivatePool() public {
        oracle.configurePool(pool1, STALENESS_THRESHOLD, MIN_UPDATE_INTERVAL);
        oracle.deactivatePool(pool1);
        
        (bool isActive,,) = oracle.poolConfig(pool1);
        assertFalse(isActive);
        
        vm.prank(updater);
        vm.expectRevert("Pool not active");
        oracle.updateNav(pool1, 1000 * 10**18, 10000 * 10**18, 9000 * 10**18);
    }
    
    function testUnauthorizedUpdate() public {
        oracle.configurePool(pool1, STALENESS_THRESHOLD, MIN_UPDATE_INTERVAL);
        
        vm.prank(address(0x999));
        vm.expectRevert();
        oracle.updateNav(pool1, 1000 * 10**18, 10000 * 10**18, 9000 * 10**18);
    }
}
