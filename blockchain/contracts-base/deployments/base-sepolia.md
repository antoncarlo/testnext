# NextBlock Deployment - Base Sepolia

**Network**: Base Sepolia (Chain ID: 84532)  
**Deployer**: 0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB  
**Deployment Date**: November 26, 2025  
**Status**: SUCCESSFUL

---

## Contract Addresses

| Contract | Address | Basescan |
|:---------|:--------|:---------|
| **NXBToken** | `0x0b678785BEA8664374eE6991714141d8E13C375a` | [View](https://sepolia.basescan.org/address/0x0b678785BEA8664374eE6991714141d8E13C375a) |
| **KycWhitelist** | `0xc4Ca6299694383a9581f6ceAEfB02e674160bef5` | [View](https://sepolia.basescan.org/address/0xc4Ca6299694383a9581f6ceAEfB02e674160bef5) |
| **NavOracle** | `0x13AfcE4669642085b851319445E0F041698BE32e` | [View](https://sepolia.basescan.org/address/0x13AfcE4669642085b851319445E0F041698BE32e) |
| **CCTPReceiver** | `0xF0c206B7C434Df70b29DD030C40dE89752dbf287` | [View](https://sepolia.basescan.org/address/0xF0c206B7C434Df70b29DD030C40dE89752dbf287) |
| **InsurancePoolToken** | `0xE5438a2cB7DE27337040fA63F88F74FC11173302` | [View](https://sepolia.basescan.org/address/0xE5438a2cB7DE27337040fA63F88F74FC11173302) |

---

## Configuration

| Parameter | Value |
|:----------|:------|
| **USDC (Base Sepolia)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **Fee Collector** | `0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB` (Deployer) |
| **Bridge Fee** | 50 basis points (0.5%) |
| **Temporary Vault** | `0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB` (Deployer) |

---

## Contract Details

### 1. NXBToken (Governance Token)
- **Type**: ERC-20
- **Initial Supply**: 100,000,000 NXB
- **Max Supply**: 1,000,000,000 NXB
- **Features**: Burnable, Permit (EIP-2612), Ownable
- **Owner**: 0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB

### 2. KycWhitelist (KYC/AML Compliance)
- **Type**: Access Control
- **Features**: Multi-level KYC (Basic, Enhanced, Institutional), Expiration tracking
- **Roles**: KYC_VERIFIER_ROLE, KYC_ADMIN_ROLE
- **Admin**: 0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB

### 3. NavOracle (Net Asset Value Oracle)
- **Type**: Oracle
- **Features**: Pool-specific NAV, Staleness detection, Update interval enforcement
- **Roles**: ORACLE_UPDATER_ROLE, POOL_MANAGER_ROLE
- **Admin**: 0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB

### 4. CCTPReceiver (Circle CCTP Bridge Receiver)
- **Type**: Bridge Receiver
- **Features**: USDC reception from Solana, Fee management, Pausable
- **USDC**: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
- **Owner**: 0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB

### 5. InsurancePoolToken (Security Token)
- **Type**: ERC-20 with Security Features
- **Symbol**: NXBI
- **Features**: Transfer restrictions, Partition management, Pausable
- **Roles**: MINTER_ROLE, COMPLIANCE_ROLE, PAUSER_ROLE
- **Admin**: 0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB

---

## Verification Commands

### Verify All Contracts on Basescan

```bash
# NXBToken
forge verify-contract 0x0b678785BEA8664374eE6991714141d8E13C375a \
  src/NXBToken.sol:NXBToken \
  --chain-id 84532 \
  --watch

# KycWhitelist
forge verify-contract 0xc4Ca6299694383a9581f6ceAEfB02e674160bef5 \
  src/KycWhitelist.sol:KycWhitelist \
  --chain-id 84532 \
  --watch

# NavOracle
forge verify-contract 0x13AfcE4669642085b851319445E0F041698BE32e \
  src/NavOracle.sol:NavOracle \
  --chain-id 84532 \
  --watch

# CCTPReceiver
forge verify-contract 0xF0c206B7C434Df70b29DD030C40dE89752dbf287 \
  src/CCTPReceiver.sol:CCTPReceiver \
  --chain-id 84532 \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address,address,address,uint256)" \
    0x036CbD53842c5426634e7929541eC2318f3dCF7e \
    0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB \
    0x1FD2A8568434c283Fb374257a3C8aBe7C6eE5dDB \
    50)

# InsurancePoolToken
forge verify-contract 0xE5438a2cB7DE27337040fA63F88F74FC11173302 \
  src/InsurancePoolToken.sol:InsurancePoolToken \
  --chain-id 84532 \
  --watch \
  --constructor-args $(cast abi-encode "constructor(string,string)" \
    "NextBlock Insurance Pool" \
    "NXBI")
```

---

## Post-Deployment Actions

### Immediate Actions
1. ✅ Verify all contracts on Basescan
2. ⏳ Update frontend with contract addresses
3. ⏳ Configure NavOracle with initial pools
4. ⏳ Add initial KYC verifiers
5. ⏳ Set proper vault address in CCTPReceiver

### Before Mainnet
1. Professional security audit
2. Comprehensive integration testing
3. Economic model review
4. Stress testing
5. Bug bounty program

---

## Frontend Integration

Update the following file with contract addresses:

**File**: `src/config/blockchain.ts`

```typescript
export const BASE_SEPOLIA_CONTRACTS = {
  NXBToken: '0x0b678785BEA8664374eE6991714141d8E13C375a',
  KycWhitelist: '0xc4Ca6299694383a9581f6ceAEfB02e674160bef5',
  NavOracle: '0x13AfcE4669642085b851319445E0F041698BE32e',
  CCTPReceiver: '0xF0c206B7C434Df70b29DD030C40dE89752dbf287',
  InsurancePoolToken: '0xE5438a2cB7DE27337040fA63F88F74FC11173302',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
};
```

---

## Gas Usage Report

| Contract | Deployment Gas | Cost (0.01 Gwei) |
|:---------|:---------------|:-----------------|
| NXBToken | ~1,033,590 | ~0.0103 ETH |
| KycWhitelist | ~729,769 | ~0.0073 ETH |
| NavOracle | ~697,137 | ~0.0070 ETH |
| CCTPReceiver | ~546,422 | ~0.0055 ETH |
| InsurancePoolToken | ~829,123 | ~0.0083 ETH |
| **TOTAL** | **~3,836,041** | **~0.0384 ETH** |

**Actual Cost**: ~0.038 ETH (~$115 at $3000/ETH)

---

## Notes

- All contracts deployed successfully on Base Sepolia testnet
- Deployer has admin/owner privileges on all contracts
- CCTPReceiver uses deployer as temporary vault (update before production use)
- All contracts passed local Foundry tests before deployment
- Contracts are ready for verification on Basescan

---

**Author**: Anton Carlo Santoro  
**Copyright**: © 2025 Anton Carlo Santoro. All rights reserved.
