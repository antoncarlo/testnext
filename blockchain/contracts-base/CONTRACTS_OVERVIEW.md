# Smart Contracts Overview - NextBlock Base Chain

**Author**: Anton Carlo Santoro  
**Date**: 2025-11-26  
**Chain**: Base (Ethereum L2)

## Contracts Summary

This directory contains 34 Solidity smart contracts for the NextBlock platform on Base Chain.

### Core Contracts (Custom for NextBlock)

#### 1. NXBToken.sol
**Type**: ERC-20 Governance Token  
**Purpose**: NextBlock governance and utility token

**Features**:
- Max supply: 1,000,000,000 NXB (1 billion)
- Burnable tokens
- EIP-2612 Permit (gasless approvals)
- Owner-controlled minting (up to max supply)

**Key Functions**:
- `mint(address to, uint256 amount)`: Mint new tokens (owner only)
- `burn(uint256 amount)`: Burn tokens
- `permit()`: Gasless approvals

---

#### 2. InsurancePoolToken.sol
**Type**: ERC-1400/3643 Security Token  
**Purpose**: Tokenized insurance pool shares

**Features**:
- Transfer restrictions (whitelist required)
- Partition management for different tranches
- Pausable transfers
- Role-based access control (Minter, Compliance, Pauser)
- KYC/AML compliance layer

**Key Functions**:
- `addToWhitelist(address)`: Add compliant address
- `mint(address, uint256)`: Mint pool tokens
- `transferByPartition(bytes32, address, uint256)`: Transfer specific tranche
- `pause()/unpause()`: Emergency controls

---

#### 3. KycWhitelist.sol
**Type**: Compliance Layer  
**Purpose**: KYC/AML verification management

**Features**:
- Multi-level KYC (None, Basic, Enhanced, Institutional)
- Expiration dates for KYC status
- Batch operations
- Role-based access (KYC Admin, KYC Verifier)

**Key Functions**:
- `approveKyc(address, KycLevel, uint256)`: Approve KYC
- `revokeKyc(address)`: Revoke KYC
- `isKycApproved(address)`: Check KYC status
- `hasMinimumKycLevel(address, KycLevel)`: Check level

---

#### 4. NavOracle.sol
**Type**: Oracle System  
**Purpose**: Net Asset Value tracking for insurance pools

**Features**:
- Multi-pool NAV tracking
- Staleness detection
- Historical NAV data
- Time-weighted average
- Role-based updates (Oracle Updater, Oracle Admin)

**Key Functions**:
- `updateNav(address pool, uint256 value, uint256 assets, uint256 liabilities)`: Update NAV
- `getNav(address pool)`: Get current NAV
- `isStale(address pool)`: Check staleness
- `configurePool(address, uint256, uint256)`: Configure pool parameters

---

#### 5. CCTPReceiver.sol
**Type**: Bridge Receiver  
**Purpose**: Receive USDC from Solana via Circle CCTP

**Features**:
- Automatic vault deposit
- Fee management (basis points)
- Emergency pause
- Non-reentrant

**Key Functions**:
- `receiveBridge(address recipient, uint256 amount)`: Receive bridged USDC
- `updateVault(address)`: Update target vault
- `updateBridgeFee(uint256)`: Update bridge fee
- `pause()/unpause()`: Emergency controls

---

### Vault System (from Obsidian)

#### 6. Vault.sol
**Type**: ERC-4626 Vault  
**Purpose**: Main vault for asset management  
**Source**: [Obsidian](https://github.com/AnirudhHack/Obsidian)

**Features**:
- ERC-4626 compliant
- Aave v3 integration for leverage
- Flash loan support
- Dynamic APY calculation

**Key Functions**:
- `deposit(uint256, address)`: Deposit assets
- `withdraw(uint256, address, address)`: Withdraw assets
- `totalAssets()`: Get total managed assets
- `convertToShares(uint256)`: Convert assets to shares

---

### Helper Contracts

#### 7. AaveHelperBase.sol
**Purpose**: Helper for Aave v3 integration on Base  
**Features**: Deposit, withdraw, borrow, repay on Aave

#### 8. UniswapV3HelperBase.sol
**Purpose**: Helper for Uniswap V3 integration on Base  
**Features**: Swap, add/remove liquidity, position management

---

### Oracle System (from Beefy Finance)

The `oracle/` directory contains 10+ oracle implementations from Beefy Finance:

1. **BeefyOracle.sol**: Main oracle aggregator
2. **BeefyOracleChainlink.sol**: Chainlink price feeds
3. **BeefyOracleUniswapV3.sol**: Uniswap V3 TWAP
4. **BeefyOracleBalancer.sol**: Balancer pool prices
5. **BeefyOraclePyth.sol**: Pyth Network integration
6. **BeefyOracleAlgebra.sol**: Algebra DEX prices
7. And more...

**Source**: [Beefy Finance](https://github.com/beefyfinance/beefy-contracts)

---

### Interfaces

The `interfaces/` directory contains standard interfaces:

- **IERC4626.sol**: ERC-4626 vault standard
- **IWETH9.sol**: Wrapped ETH interface
- **UniswapV3Interface.sol**: Uniswap V3 interfaces
- **Aave interfaces**: ILendingPool, ILendingPoolAddressProvider, etc.

---

## Contract Dependencies

### OpenZeppelin Contracts
All contracts use OpenZeppelin v5.x for:
- ERC-20, ERC-4626 implementations
- Access control (Ownable, AccessControl)
- Security (ReentrancyGuard, Pausable)
- Utilities (Permit, Burnable)

### Installation
```bash
npm install @openzeppelin/contracts@^5.0.0
```

---

## Deployment Order

1. **KycWhitelist** (independent)
2. **NavOracle** (independent)
3. **NXBToken** (independent)
4. **Vault** (requires USDC address)
5. **InsurancePoolToken** (requires KycWhitelist)
6. **CCTPReceiver** (requires USDC, Vault)

---

## Testing

### Unit Tests
Create comprehensive unit tests using Foundry:

```bash
cd blockchain/contracts-base
forge install
forge test
```

### Integration Tests
Test full flow:
1. KYC approval
2. Token minting
3. Vault deposit
4. NAV updates
5. Cross-chain bridge

---

## Security Considerations

### Audits Required
Before mainnet deployment, audit:
1. **NXBToken**: Token economics and minting
2. **InsurancePoolToken**: Transfer restrictions and compliance
3. **Vault**: Asset management and flash loan logic
4. **CCTPReceiver**: Bridge security and reentrancy

### Best Practices
- All contracts use ReentrancyGuard where needed
- Access control via OpenZeppelin AccessControl
- Pausable for emergency stops
- Input validation on all external functions

---

## Gas Optimization

### Recommendations
1. Use `calldata` instead of `memory` for read-only arrays
2. Pack struct variables to save storage slots
3. Use `unchecked` for safe arithmetic operations
4. Batch operations where possible (e.g., `batchApproveKyc`)

---

## Mainnet Addresses (To Be Deployed)

| Contract | Address | Status |
|:---------|:--------|:-------|
| KycWhitelist | TBD | Not deployed |
| NavOracle | TBD | Not deployed |
| NXBToken | TBD | Not deployed |
| Vault | TBD | Not deployed |
| InsurancePoolToken | TBD | Not deployed |
| CCTPReceiver | TBD | Not deployed |

---

## License

All custom contracts (NXBToken, InsurancePoolToken, KycWhitelist, NavOracle, CCTPReceiver) are licensed under MIT.

Vault and helper contracts from Obsidian: Check original repository license.  
Oracle contracts from Beefy Finance: Check original repository license.

---

## Author

**Anton Carlo Santoro**  
Copyright (c) 2025 Anton Carlo Santoro. All rights reserved.

---

## Next Steps

1. **Write comprehensive tests** with Foundry
2. **Deploy to Base Sepolia testnet**
3. **Integrate with frontend** (update contract addresses)
4. **Professional security audit**
5. **Deploy to Base mainnet**
6. **Verify contracts on Basescan**

---

## References

- [Obsidian Vault](https://github.com/AnirudhHack/Obsidian)
- [Beefy Finance Contracts](https://github.com/beefyfinance/beefy-contracts)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [ERC-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [ERC-1400 Security Token](https://github.com/ethereum/EIPs/issues/1400)
