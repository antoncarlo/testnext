/**
 * Deploy Treasury Multisig on Base Sepolia
 * Uses Gnosis Safe contracts
 * 
 * Configuration: 2/3 multisig
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gnosis Safe contracts on Base Sepolia
const SAFE_FACTORY_ADDRESS = '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2';
const SAFE_SINGLETON_ADDRESS = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552';

// Configuration
const THRESHOLD = 2; // 2 out of 3 signatures required
const NUM_SIGNERS = 3;

async function main() {
  console.log('🔐 Deploying Treasury Multisig on Base Sepolia');
  console.log('================================================\n');

  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  // Generate 3 test wallets as signers
  console.log('📝 Generating signer wallets...\n');
  
  const signers = [];
  const signerData = [];
  
  for (let i = 0; i < NUM_SIGNERS; i++) {
    const wallet = ethers.Wallet.createRandom();
    signers.push(wallet.address);
    signerData.push({
      index: i + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
    });
    
    console.log(`Signer ${i + 1}:`);
    console.log(`  Address: ${wallet.address}`);
    console.log(`  Private Key: ${wallet.privateKey}`);
    console.log(`  Mnemonic: ${wallet.mnemonic.phrase}`);
    console.log('');
  }

  // Sort signers (required by Gnosis Safe)
  signers.sort((a, b) => {
    return BigInt(a) < BigInt(b) ? -1 : 1;
  });

  console.log('✅ Signers generated and sorted\n');
  console.log('📋 Multisig Configuration:');
  console.log(`  Threshold: ${THRESHOLD}/${NUM_SIGNERS}`);
  console.log(`  Signers: ${signers.join(', ')}\n`);

  // Create Safe setup data
  const safeInterface = new ethers.Interface([
    'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external'
  ]);

  const setupData = safeInterface.encodeFunctionData('setup', [
    signers,
    THRESHOLD,
    ethers.ZeroAddress, // to
    '0x', // data
    ethers.ZeroAddress, // fallbackHandler
    ethers.ZeroAddress, // paymentToken
    0, // payment
    ethers.ZeroAddress, // paymentReceiver
  ]);

  // Predict Safe address
  const saltNonce = Date.now();
  
  // Calculate predicted address using create2
  const initCodeHash = ethers.keccak256(
    ethers.concat([
      '0x602d8060093d393df3363d3d373d3d3d363d73',
      ethers.zeroPadValue(SAFE_SINGLETON_ADDRESS, 20),
      '0x5af43d82803e903d91602b57fd5bf3'
    ])
  );

  const salt = ethers.keccak256(
    ethers.solidityPacked(
      ['bytes32', 'uint256'],
      [ethers.keccak256(setupData), saltNonce]
    )
  );

  const predictedAddress = ethers.getCreate2Address(
    SAFE_FACTORY_ADDRESS,
    salt,
    initCodeHash
  );

  console.log('🔮 Predicted Multisig Address:', predictedAddress);
  console.log('');

  // Save configuration
  const config = {
    network: 'base-sepolia',
    multisigAddress: predictedAddress,
    threshold: THRESHOLD,
    numSigners: NUM_SIGNERS,
    signers: signers,
    signerDetails: signerData,
    safeFactoryAddress: SAFE_FACTORY_ADDRESS,
    safeSingletonAddress: SAFE_SINGLETON_ADDRESS,
    saltNonce: saltNonce,
    setupData: setupData,
    deploymentDate: new Date().toISOString(),
    deploymentScript: {
      description: 'To deploy this multisig, you need to:',
      steps: [
        '1. Fund a deployer wallet with Base Sepolia ETH',
        '2. Call createProxyWithNonce on Safe Factory',
        '3. Or use Gnosis Safe UI: https://app.safe.global/new-safe/create?chain=basesep',
      ],
      manualDeployment: {
        url: 'https://app.safe.global/new-safe/create?chain=basesep',
        instructions: [
          '1. Go to the URL above',
          '2. Connect your wallet',
          '3. Add the 3 signer addresses',
          '4. Set threshold to 2',
          '5. Deploy the Safe',
        ],
      },
    },
  };

  const configPath = path.join(__dirname, '../treasury-multisig-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log('✅ Configuration saved to:', configPath);
  console.log('');
  console.log('⚠️  IMPORTANT: Save the signer private keys securely!');
  console.log('⚠️  These wallets control the treasury multisig.');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Deploy the multisig using Gnosis Safe UI or script');
  console.log('2. Update VITE_TREASURY_ADDRESS in environment variables');
  console.log('3. Redeploy DeFiVault with the treasury address');
  console.log('');
  console.log('🔗 Gnosis Safe UI:');
  console.log('https://app.safe.global/new-safe/create?chain=basesep');
  console.log('');

  return {
    multisigAddress: predictedAddress,
    signers: signers,
    threshold: THRESHOLD,
  };
}

main()
  .then((result) => {
    console.log('✅ Treasury multisig setup complete!');
    console.log('');
    console.log('Multisig Address:', result.multisigAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
