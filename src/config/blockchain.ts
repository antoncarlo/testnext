/**
 * Blockchain Configuration
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 */

export const BLOCKCHAIN_CONFIG = {
  // Base Chain Configuration
  base: {
    chainId: 8453, // Base Mainnet
    chainIdTestnet: 84532, // Base Sepolia
    rpcUrl: import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
    rpcUrlTestnet: import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    explorerUrl: 'https://basescan.org',
    explorerUrlTestnet: 'https://sepolia.basescan.org',
    
    // Smart Contract Addresses (Base Mainnet)
    contracts: {
      vault: import.meta.env.VITE_VAULT_ADDRESS || '',
      strategy: import.meta.env.VITE_STRATEGY_ADDRESS || '',
      navOracle: import.meta.env.VITE_NAV_ORACLE_ADDRESS || '',
      kycWhitelist: import.meta.env.VITE_KYC_WHITELIST_ADDRESS || '',
      cctpReceiver: import.meta.env.VITE_CCTP_RECEIVER_ADDRESS || '',
      nxbToken: import.meta.env.VITE_NXB_TOKEN_ADDRESS || '',
      insurancePoolToken: import.meta.env.VITE_INSURANCE_POOL_TOKEN_ADDRESS || '',
      usdc: import.meta.env.VITE_BASE_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    
    // Smart Contract Addresses (Base Sepolia Testnet) - DEPLOYED
    contractsTestnet: {
      nxbToken: '0x0b678785BEA8664374eE6991714141d8E13C375a',
      kycWhitelist: '0xc4Ca6299694383a9581f6ceAEfB02e674160bef5',
      navOracle: '0x13AfcE4669642085b851319445E0F041698BE32e',
      cctpReceiver: '0xF0c206B7C434Df70b29DD030C40dE89752dbf287',
      insurancePoolToken: '0xE5438a2cB7DE27337040fA63F88F74FC11173302',
      usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    },
  },
  
  // Solana Configuration
  solana: {
    network: import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta',
    rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    rpcUrlDevnet: import.meta.env.VITE_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    
    // Program Addresses (Solana)
    programs: {
      satellite: import.meta.env.VITE_SOLANA_PROGRAM_ID || '',
      usdc: import.meta.env.VITE_SOLANA_USDC_ADDRESS || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      cctp: import.meta.env.VITE_SOLANA_CCTP_ADDRESS || '',
    },
  },
  
  // CCTP Bridge Configuration
  cctp: {
    enabled: true,
    domain: {
      base: 6,
      solana: 5,
    },
    messageTransmitter: {
      base: '0x9ff9a4da6f2157A9c82CE756f8fD7E0d75be8895',
      solana: 'CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd',
    },
  },
  
  // Points System Configuration
  points: {
    multipliers: {
      holding: 1,
      liquidity: 2,
      lending: 3,
      referral: 4,
    },
    updateInterval: 3600000, // 1 hour in milliseconds
  },
};

export const isTestnet = () => {
  return import.meta.env.VITE_NETWORK === 'testnet' || import.meta.env.MODE === 'development';
};

export const getBaseChainId = () => {
  return isTestnet() ? BLOCKCHAIN_CONFIG.base.chainIdTestnet : BLOCKCHAIN_CONFIG.base.chainId;
};

export const getBaseRpcUrl = () => {
  return isTestnet() ? BLOCKCHAIN_CONFIG.base.rpcUrlTestnet : BLOCKCHAIN_CONFIG.base.rpcUrl;
};

export const getSolanaRpcUrl = () => {
  return isTestnet() ? BLOCKCHAIN_CONFIG.solana.rpcUrlDevnet : BLOCKCHAIN_CONFIG.solana.rpcUrl;
};

export const getBaseContracts = () => {
  return isTestnet() ? BLOCKCHAIN_CONFIG.base.contractsTestnet : BLOCKCHAIN_CONFIG.base.contracts;
};
