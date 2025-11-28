/**
 * Deploy DeFiVault Contract on Base Sepolia
 * With Treasury Multisig configured
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load treasury config
const treasuryConfigPath = path.join(__dirname, '../treasury-multisig-config.json');
const treasuryConfig = JSON.parse(fs.readFileSync(treasuryConfigPath, 'utf8'));

// Configuration
const TREASURY_ADDRESS = treasuryConfig.multisigAddress;
const RPC_URL = 'https://sepolia.base.org';

// Vault parameters
const VAULT_NAME = "NextBlock DeFi Vault";
const PROTOCOL_TYPE = "Yield Farming";
const BASE_APY = 850; // 8.50% in basis points
const POINTS_MULTIPLIER = 2;

// DeFiVault contract ABI (constructor + key functions)
const VAULT_ABI = [
  "constructor(string memory _vaultName, string memory _protocolType, uint256 _baseAPY, uint256 _pointsMultiplier, address _treasury)",
  "function vaultName() view returns (string)",
  "function treasury() view returns (address)",
  "function emergencyWithdrawToTreasury() external",
  "function enableEmergencyMode() external",
  "function owner() view returns (address)"
];

async function main() {
  console.log('🚀 Deploying DeFiVault on Base Sepolia');
  console.log('======================================\n');

  console.log('📋 Configuration:');
  console.log(`  Vault Name: ${VAULT_NAME}`);
  console.log(`  Protocol Type: ${PROTOCOL_TYPE}`);
  console.log(`  Base APY: ${BASE_APY / 100}%`);
  console.log(`  Points Multiplier: ${POINTS_MULTIPLIER}x`);
  console.log(`  Treasury Address: ${TREASURY_ADDRESS}`);
  console.log('');

  // Read contract bytecode
  const contractPath = path.join(__dirname, '../contracts/DeFiVault.sol');
  
  console.log('⚠️  Note: This script requires the contract to be compiled first.');
  console.log('⚠️  Please compile using: forge build or hardhat compile');
  console.log('');
  console.log('📝 Deployment Instructions:');
  console.log('');
  console.log('Option 1: Using Forge (Foundry)');
  console.log('--------------------------------');
  console.log('1. Install Foundry if not installed:');
  console.log('   curl -L https://foundry.paradigm.xyz | bash');
  console.log('   foundryup');
  console.log('');
  console.log('2. Create foundry.toml in project root:');
  console.log('   [profile.default]');
  console.log('   src = "contracts"');
  console.log('   out = "out"');
  console.log('   libs = ["node_modules"]');
  console.log('');
  console.log('3. Deploy with forge:');
  console.log(`   forge create contracts/DeFiVault.sol:DeFiVault \\`);
  console.log(`     --rpc-url ${RPC_URL} \\`);
  console.log(`     --private-key YOUR_PRIVATE_KEY \\`);
  console.log(`     --constructor-args \\`);
  console.log(`       "${VAULT_NAME}" \\`);
  console.log(`       "${PROTOCOL_TYPE}" \\`);
  console.log(`       ${BASE_APY} \\`);
  console.log(`       ${POINTS_MULTIPLIER} \\`);
  console.log(`       ${TREASURY_ADDRESS}`);
  console.log('');
  console.log('Option 2: Using thirdweb Deploy');
  console.log('--------------------------------');
  console.log('1. Install thirdweb CLI:');
  console.log('   npm install -g thirdweb');
  console.log('');
  console.log('2. Deploy:');
  console.log('   npx thirdweb deploy');
  console.log('');
  console.log('3. Fill in constructor parameters in the UI:');
  console.log(`   - _vaultName: ${VAULT_NAME}`);
  console.log(`   - _protocolType: ${PROTOCOL_TYPE}`);
  console.log(`   - _baseAPY: ${BASE_APY}`);
  console.log(`   - _pointsMultiplier: ${POINTS_MULTIPLIER}`);
  console.log(`   - _treasury: ${TREASURY_ADDRESS}`);
  console.log('');
  console.log('Option 3: Using Remix IDE');
  console.log('-------------------------');
  console.log('1. Go to https://remix.ethereum.org');
  console.log('2. Create new file: DeFiVault.sol');
  console.log('3. Paste contract code');
  console.log('4. Compile with Solidity 0.8.20');
  console.log('5. Deploy to Base Sepolia with parameters above');
  console.log('');
  console.log('⚠️  IMPORTANT: Save the deployed contract address!');
  console.log('⚠️  You will need it to update VITE_VAULT_ADDRESS');
  console.log('');

  // Save deployment info
  const deploymentInfo = {
    network: 'base-sepolia',
    contractName: 'DeFiVault',
    constructorArgs: {
      vaultName: VAULT_NAME,
      protocolType: PROTOCOL_TYPE,
      baseAPY: BASE_APY,
      pointsMultiplier: POINTS_MULTIPLIER,
      treasury: TREASURY_ADDRESS,
    },
    treasuryMultisig: {
      address: TREASURY_ADDRESS,
      threshold: treasuryConfig.threshold,
      signers: treasuryConfig.signers,
    },
    deploymentDate: new Date().toISOString(),
    status: 'pending',
    notes: [
      'Contract needs to be deployed manually using one of the methods above',
      'After deployment, update VITE_VAULT_ADDRESS environment variable',
      'Verify contract on BaseScan after deployment',
    ],
  };

  const infoPath = path.join(__dirname, '../vault-deployment-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));

  console.log('✅ Deployment info saved to:', infoPath);
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Deploy the contract using one of the methods above');
  console.log('2. Save the deployed contract address');
  console.log('3. Run: ./scripts/add-vault-strategy-addresses.sh <VAULT_ADDRESS>');
  console.log('4. Verify contract on BaseScan');
  console.log('');

  return deploymentInfo;
}

main()
  .then((result) => {
    console.log('✅ Deployment preparation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
