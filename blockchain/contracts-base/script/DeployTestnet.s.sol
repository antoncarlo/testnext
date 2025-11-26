// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NXBToken.sol";
import "../src/KycWhitelist.sol";
import "../src/NavOracle.sol";
import "../src/CCTPReceiver.sol";
import "../src/InsurancePoolToken.sol";

/**
 * @title DeployTestnet
 * @notice Deployment script for NextBlock contracts on Base Sepolia testnet
 * @author Anton Carlo Santoro
 */
contract DeployTestnet is Script {
    // Deployment parameters
    uint256 constant INITIAL_NXB_SUPPLY = 100_000_000 * 10**18; // 100M NXB
    
    // USDC address on Base Sepolia
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    // Temporary vault and fee collector (deployer)
    address deployer;
    
    // Bridge fee: 0.5% (50 basis points)
    uint256 constant BRIDGE_FEE = 50;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy NXBToken (Governance Token)
        console.log("\n1. Deploying NXBToken...");
        NXBToken nxbToken = new NXBToken(INITIAL_NXB_SUPPLY);
        console.log("NXBToken deployed at:", address(nxbToken));
        console.log("Initial supply:", nxbToken.totalSupply() / 10**18, "NXB");
        console.log("Max supply:", nxbToken.maxSupply() / 10**18, "NXB");
        
        // 2. Deploy KycWhitelist
        console.log("\n2. Deploying KycWhitelist...");
        KycWhitelist kycWhitelist = new KycWhitelist();
        console.log("KycWhitelist deployed at:", address(kycWhitelist));
        
        // 3. Deploy NavOracle
        console.log("\n3. Deploying NavOracle...");
        NavOracle navOracle = new NavOracle();
        console.log("NavOracle deployed at:", address(navOracle));
        
        // 4. Deploy CCTPReceiver
        console.log("\n4. Deploying CCTPReceiver...");
        // Note: using deployer as temporary vault, update after vault deployment
        CCTPReceiver cctpReceiver = new CCTPReceiver(
            USDC_BASE_SEPOLIA,
            deployer,   // Temporary vault (deployer)
            deployer,   // Fee collector
            BRIDGE_FEE  // 0.5% fee
        );
        console.log("CCTPReceiver deployed at:", address(cctpReceiver));
        console.log("USDC address:", USDC_BASE_SEPOLIA);
        console.log("Fee collector:", deployer);
        console.log("Bridge fee:", BRIDGE_FEE, "basis points");
        
        // 5. Deploy InsurancePoolToken
        console.log("\n5. Deploying InsurancePoolToken...");
        InsurancePoolToken poolToken = new InsurancePoolToken(
            "NextBlock Insurance Pool",
            "NXBI"
        );
        console.log("InsurancePoolToken deployed at:", address(poolToken));
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n========================================");
        console.log("DEPLOYMENT SUMMARY - Base Sepolia");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("Network: Base Sepolia (Chain ID: 84532)");
        console.log("\nContract Addresses:");
        console.log("-------------------");
        console.log("NXBToken:", address(nxbToken));
        console.log("KycWhitelist:", address(kycWhitelist));
        console.log("NavOracle:", address(navOracle));
        console.log("CCTPReceiver:", address(cctpReceiver));
        console.log("InsurancePoolToken:", address(poolToken));
        console.log("\nConfiguration:");
        console.log("---------------");
        console.log("USDC (Base Sepolia):", USDC_BASE_SEPOLIA);
        console.log("Fee Collector:", deployer);
        console.log("Bridge Fee:", BRIDGE_FEE, "basis points (0.5%)");
        console.log("========================================");
        
        // Save deployment addresses to file
        string memory deploymentInfo = string(abi.encodePacked(
            "# NextBlock Deployment - Base Sepolia\n\n",
            "**Network**: Base Sepolia (Chain ID: 84532)\n",
            "**Deployer**: ", vm.toString(deployer), "\n",
            "**Timestamp**: ", vm.toString(block.timestamp), "\n\n",
            "## Contract Addresses\n\n",
            "- **NXBToken**: `", vm.toString(address(nxbToken)), "`\n",
            "- **KycWhitelist**: `", vm.toString(address(kycWhitelist)), "`\n",
            "- **NavOracle**: `", vm.toString(address(navOracle)), "`\n",
            "- **CCTPReceiver**: `", vm.toString(address(cctpReceiver)), "`\n",
            "- **InsurancePoolToken**: `", vm.toString(address(poolToken)), "`\n\n",
            "## Configuration\n\n",
            "- **USDC**: `", vm.toString(USDC_BASE_SEPOLIA), "`\n",
            "- **Fee Collector**: `", vm.toString(deployer), "`\n",
            "- **Bridge Fee**: 50 basis points (0.5%)\n\n",
            "## Verification Commands\n\n",
            "```bash\n",
            "forge verify-contract ", vm.toString(address(nxbToken)), " src/NXBToken.sol:NXBToken --chain-id 84532 --watch\n",
            "forge verify-contract ", vm.toString(address(kycWhitelist)), " src/KycWhitelist.sol:KycWhitelist --chain-id 84532 --watch\n",
            "forge verify-contract ", vm.toString(address(navOracle)), " src/NavOracle.sol:NavOracle --chain-id 84532 --watch\n",
            "forge verify-contract ", vm.toString(address(cctpReceiver)), " src/CCTPReceiver.sol:CCTPReceiver --chain-id 84532 --watch --constructor-args $(cast abi-encode \"constructor(address,address,address,uint256)\" ", vm.toString(USDC_BASE_SEPOLIA), " ", vm.toString(address(0)), " ", vm.toString(deployer), " 50)\n",
            "forge verify-contract ", vm.toString(address(poolToken)), " src/InsurancePoolToken.sol:InsurancePoolToken --chain-id 84532 --watch --constructor-args $(cast abi-encode \"constructor(string,string)\" \"NextBlock Insurance Pool\" \"NXBI\")\n",
            "```\n"
        ));
        
        // vm.writeFile("deployments/base-sepolia.md", deploymentInfo); // Disabled for security
        console.log("\nDeployment info saved to: deployments/base-sepolia.md");
    }
}
