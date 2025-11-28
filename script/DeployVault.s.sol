// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/DeFiVault.sol";

contract DeployVault is Script {
    function run() external {
        vm.startBroadcast();
        
        DeFiVault vault = new DeFiVault(
            "NextBlock DeFi Vault",
            "Yield Farming",
            850,
            2,
            0x9b0B5c2D51d1603408E66d0A850AC2823dD4cb49
        );
        
        console.log("DeFiVault deployed to:", address(vault));
        
        vm.stopBroadcast();
    }
}
