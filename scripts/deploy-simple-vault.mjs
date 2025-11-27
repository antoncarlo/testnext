import { ethers } from 'ethers';
import fs from 'fs';

// Vault parameters
const vaultName = process.env.VAULT_NAME || "ETH Staking Pool";
const protocolType = process.env.PROTOCOL_TYPE || "Staking";
const baseAPY = parseInt(process.env.BASE_APY) || 1250;
const pointsMultiplier = parseInt(process.env.POINTS_MULTIPLIER) || 3;

// Network configuration
const RPC_URL = "https://sepolia.base.org";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("❌ DEPLOYER_PRIVATE_KEY not set");
  process.exit(1);
}

// Load compiled contract
const bytecode = "0x" + fs.readFileSync('/home/ubuntu/testnext/build/contracts_SimpleVault_sol_SimpleVault.bin', 'utf8');
const abi = JSON.parse(fs.readFileSync('/home/ubuntu/testnext/build/contracts_SimpleVault_sol_SimpleVault.abi', 'utf8'));

console.log("=====================================");
console.log("🚀 Deploying SimpleVault to Base Sepolia");
console.log("=====================================");
console.log("Vault Name:", vaultName);
console.log("Protocol Type:", protocolType);
console.log("Base APY:", (baseAPY / 100).toFixed(2), "%");
console.log("Points Multiplier:", pointsMultiplier, "x");
console.log("=====================================\n");

async function main() {
  try {
    // Connect to provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log("Deploying with account:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

    if (balance === 0n) {
      console.error("❌ Account has no ETH for gas fees");
      console.log("\n💡 Get testnet ETH from Base Sepolia faucet:");
      console.log("   https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
      process.exit(1);
    }

    // Create contract factory
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    console.log("Deploying contract...");
    const contract = await factory.deploy(
      vaultName,
      protocolType,
      baseAPY,
      pointsMultiplier
    );

    console.log("Transaction sent! Hash:", contract.deploymentTransaction().hash);
    console.log("Waiting for confirmation...\n");

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log("\n=====================================");
    console.log("✅ SimpleVault deployed successfully!");
    console.log("=====================================");
    console.log("Contract Address:", address);
    console.log("Network: Base Sepolia (Testnet)");
    console.log("Chain ID: 84532");
    console.log("\n🔗 View on Basescan:");
    console.log(`https://sepolia.basescan.org/address/${address}`);
    console.log("\n📝 Save this address to database:");
    console.log(`UPDATE defi_strategies SET contract_address = '${address}' WHERE name = '${vaultName}';`);
    console.log("=====================================\n");

    // Verify deployment
    console.log("Verifying deployment...");
    const deployedVaultName = await contract.vaultName();
    const deployedProtocolType = await contract.protocolType();
    const deployedBaseAPY = await contract.baseAPY();
    const deployedPointsMultiplier = await contract.pointsMultiplier();

    console.log("\n✓ Vault Name:", deployedVaultName);
    console.log("✓ Protocol Type:", deployedProtocolType);
    console.log("✓ Base APY:", (Number(deployedBaseAPY) / 100).toFixed(2), "%");
    console.log("✓ Points Multiplier:", Number(deployedPointsMultiplier), "x");
    console.log("\n🎉 Deployment complete!\n");

    return address;
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("\n💡 Get testnet ETH from Base Sepolia faucet:");
      console.log("   https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    }
    process.exit(1);
  }
}

main();
