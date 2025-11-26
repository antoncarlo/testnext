// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/KycWhitelist.sol";

contract KycWhitelistTest is Test {
    KycWhitelist public kyc;
    address public admin;
    address public verifier;
    address public user1;
    address public user2;
    
    function setUp() public {
        admin = address(this);
        verifier = address(0x1);
        user1 = address(0x2);
        user2 = address(0x3);
        
        kyc = new KycWhitelist();
        kyc.grantRole(kyc.KYC_VERIFIER_ROLE(), verifier);
    }
    
    function testApproveKyc() public {
        vm.prank(verifier);
        kyc.approveKyc(user1, KycWhitelist.KycLevel.Basic, 0);
        
        assertTrue(kyc.isKycApproved(user1));
    }
    
    function testRevokeKyc() public {
        vm.prank(verifier);
        kyc.approveKyc(user1, KycWhitelist.KycLevel.Basic, 0);
        
        kyc.revokeKyc(user1);
        assertFalse(kyc.isKycApproved(user1));
    }
    
    function testKycLevels() public {
        vm.startPrank(verifier);
        
        kyc.approveKyc(user1, KycWhitelist.KycLevel.Basic, 0);
        assertTrue(kyc.hasMinimumKycLevel(user1, KycWhitelist.KycLevel.Basic));
        assertFalse(kyc.hasMinimumKycLevel(user1, KycWhitelist.KycLevel.Enhanced));
        
        kyc.approveKyc(user2, KycWhitelist.KycLevel.Institutional, 0);
        assertTrue(kyc.hasMinimumKycLevel(user2, KycWhitelist.KycLevel.Basic));
        assertTrue(kyc.hasMinimumKycLevel(user2, KycWhitelist.KycLevel.Enhanced));
        assertTrue(kyc.hasMinimumKycLevel(user2, KycWhitelist.KycLevel.Institutional));
        
        vm.stopPrank();
    }
    
    function testKycExpiration() public {
        uint256 expirationDate = block.timestamp + 30 days;
        
        vm.prank(verifier);
        kyc.approveKyc(user1, KycWhitelist.KycLevel.Basic, expirationDate);
        
        assertTrue(kyc.isKycApproved(user1));
        
        // Fast forward past expiration
        vm.warp(expirationDate + 1);
        assertFalse(kyc.isKycApproved(user1));
    }
    
    function testBatchApproveKyc() public {
        address[] memory users = new address[](3);
        users[0] = user1;
        users[1] = user2;
        users[2] = address(0x4);
        
        vm.prank(verifier);
        kyc.batchApproveKyc(users, KycWhitelist.KycLevel.Basic, 0);
        
        assertTrue(kyc.isKycApproved(user1));
        assertTrue(kyc.isKycApproved(user2));
        assertTrue(kyc.isKycApproved(address(0x4)));
    }
    
    function testUnauthorizedApproval() public {
        vm.prank(user1);
        vm.expectRevert();
        kyc.approveKyc(user2, KycWhitelist.KycLevel.Basic, 0);
    }
}
