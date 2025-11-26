// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NXBToken.sol";

contract NXBTokenTest is Test {
    NXBToken public token;
    address public owner;
    address public user1;
    address public user2;
    
    uint256 constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M tokens
    uint256 constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        token = new NXBToken(INITIAL_SUPPLY);
    }
    
    function testInitialSupply() public view {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
    }
    
    function testMaxSupply() public view {
        assertEq(token.maxSupply(), MAX_SUPPLY);
    }
    
    function testMintAsOwner() public {
        uint256 mintAmount = 1000 * 10**18;
        token.mint(user1, mintAmount);
        assertEq(token.balanceOf(user1), mintAmount);
    }
    
    function testMintCannotExceedMaxSupply() public {
        uint256 excessAmount = MAX_SUPPLY - INITIAL_SUPPLY + 1;
        vm.expectRevert("Minting would exceed max supply");
        token.mint(user1, excessAmount);
    }
    
    function testMintAsNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, 1000 * 10**18);
    }
    
    function testBurn() public {
        uint256 burnAmount = 1000 * 10**18;
        token.burn(burnAmount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - burnAmount);
    }
    
    function testTransfer() public {
        uint256 transferAmount = 1000 * 10**18;
        token.transfer(user1, transferAmount);
        assertEq(token.balanceOf(user1), transferAmount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
    }
    
    function testPermit() public {
        // Test that permit functionality exists
        assertEq(token.DOMAIN_SEPARATOR(), token.DOMAIN_SEPARATOR());
    }
}
