const hre = require("hardhat");

async function main() {
  // Parametri del vault da environment variables
  const vaultName = process.env.VAULT_NAME || "ETH Staking Pool";
  const protocolType = process.env.PROTOCOL_TYPE || "Staking";
  const baseAPY = parseInt(process.env.BASE_APY) || 1250; // 12.50% in basis points
  const pointsMultiplier = parseInt(process.env.POINTS_MULTIPLIER) || 3;

  console.log("=====================================");
  console.log("🚀 Deploying DeFiVault to Base Sepolia");
  console.log("=====================================");
  console.log("Vault Name:", vaultName);
  console.log("Protocol Type:", protocolType);
  console.log("Base APY:", (baseAPY / 100).toFixed(2), "%");
  console.log("Points Multiplier:", pointsMultiplier, "x");
  console.log("=====================================\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("Deploying DeFiVault contract...");
  const DeFiVault = await hre.ethers.getContractFactory("DeFiVault");
  const vault = await DeFiVault.deploy(
    vaultName,
    protocolType,
    baseAPY,
    pointsMultiplier
  );

  await vault.waitForDeployment();
  const address = await vault.getAddress();

  console.log("\n=====================================");
  console.log("✅ DeFiVault deployed successfully!");
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
  const deployedVaultName = await vault.vaultName();
  const deployedProtocolType = await vault.protocolType();
  const deployedBaseAPY = await vault.baseAPY();
  const deployedPointsMultiplier = await vault.pointsMultiplier();

  console.log("\n✓ Vault Name:", deployedVaultName);
  console.log("✓ Protocol Type:", deployedProtocolType);
  console.log("✓ Base APY:", (Number(deployedBaseAPY) / 100).toFixed(2), "%");
  console.log("✓ Points Multiplier:", Number(deployedPointsMultiplier), "x");
  console.log("\n🎉 Deployment complete!\n");

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
