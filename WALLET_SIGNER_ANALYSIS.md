# SwapKit Wallet Signer Implementation Analysis

## Executive Summary

Analysis of 19 wallet packages to identify custom signer implementations and toolbox method overrides.

## Classification by Implementation Pattern

### 🔴 Full Custom Signer Implementations

These wallets implement comprehensive custom signer methods:

| Wallet | Custom Signers | Key Methods | Notes |
|--------|---------------|-------------|-------|
| **Bitget** | BTC, Cosmos, Solana, Tron | `signTransaction`, `getAddress` | Most comprehensive multi-chain custom signers |
| **Coinbase** | EVM (AbstractSigner) | `signTransaction`, `signMessage`, `getAddress` | Custom EVM signer class |
| **WalletConnect** | EVM, NEAR, Tron | `signTransaction`, `signMessage`, `getAddress` | Protocol-based signers |
| **OneKey** | BTC (sats-connect), EVM | `signTransaction`, `signMessage`, `getAddress` | Custom EVM AbstractSigner |
| **OKX** | BTC, Tron, Near | `signTransaction`, `getAddress` | Multi-chain custom implementations |
| **TronLink** | Tron | `signTransaction`, `getAddress` | Specialized Tron signer |

### 🟡 Partial Custom Implementations

These wallets have selective custom implementations:

| Wallet | Custom Elements | Standard Elements | Notes |
|--------|----------------|-------------------|-------|
| **CTRL** | Near signer wrapper | EVM, Cosmos use standard | Extensive method overrides |
| **Exodus** | BTC (sats-connect) | EVM, Solana standard | Mixed approach |
| **KeepKey BEX** | BTC/UTXO signing | Uses provider signers | Custom wallet transfer methods |
| **Vultisig** | Custom transfer methods | Provider signers | Heavy toolbox overrides |

### 🟢 Standard Implementations

These wallets use standard toolbox signers:

| Wallet | Signer Type | Toolbox Overrides | Notes |
|--------|------------|-------------------|-------|
| **Cosmostation** | Keplr + window.ethereum | None | Standard patterns |
| **Keplr** | OfflineSignerOnlyAmino | None | Cosmos-only, minimal customization |
| **Phantom** | Standard providers | Solana transfer override | Minimal customization |
| **PolkadotJS** | Extension signer | None | Single-chain standard |
| **Talisman** | Standard toolbox signers | None | Multi-chain standard |

### 🔵 Special Cases

| Wallet | Pattern | Explanation |
|--------|---------|-------------|
| **Radix** | No standard toolbox | Custom implementation with `signAndBroadcast` |
| **Xaman** | App-specific flow | Uses QR/deep link signing, no standard signer |

## Toolbox Method Override Analysis

### Heavy Override Pattern
Wallets that extensively modify toolbox behavior:

1. **CTRL**
   - Overrides: `transfer`, `deposit` (THORChain/Maya/BTC/UTXO/Near)
   - Custom: `walletTransfer`, `createTransaction` methods

2. **Vultisig**
   - Overrides: `transfer` (all chains), `deposit` (THORChain/Maya)
   - Custom: `approve`, `call`, `sendTransaction` for EVM

3. **KeepKey BEX**
   - Overrides: `transfer`, `deposit` (Cosmos/THORChain)
   - Custom: `getBalance` for BTC

### Selective Override Pattern
Wallets with specific customizations:

1. **Exodus**: Solana `transfer` override
2. **Phantom**: Solana `transfer` with custom validation
3. **OKX**: Cosmos `transfer` override
4. **WalletConnect**: THORChain `transfer` and `deposit` overrides

### No Override Pattern
Wallets using standard toolboxes:
- Cosmostation, Keplr, OneKey, PolkadotJS, Talisman, TronLink

## Chain Support Matrix

### Multi-Chain Leaders (15+ chains)
1. **CTRL**: 21 chains
2. **KeepKey BEX**: 18 chains
3. **Vultisig**: 17 chains
4. **OKX**: 15 chains
5. **WalletConnect**: 15 chains

### Moderate Support (5-14 chains)
1. **Bitget**: 14 chains
2. **Cosmostation**: 11 chains
3. **OneKey**: 11 chains
4. **Exodus**: ~11 chains
5. **Talisman**: 9 chains
6. **Coinbase**: 7 chains

### Specialized/Limited (1-4 chains)
1. **Keplr**: 4 chains (Cosmos ecosystem)
2. **Phantom**: 3 chains
3. **PolkadotJS**: 1 chain (Polkadot)
4. **Radix**: 1 chain (Radix)
5. **TronLink**: 1 chain (Tron)
6. **Xaman**: 1 chain (Ripple)

## Key Findings

### Signer Implementation Patterns

1. **Custom Signer Pattern** (30% of wallets)
   - Implement full `ChainSigner` interface
   - Methods: `getAddress()`, `signTransaction()`, `signMessage()`
   - Examples: Bitget, Coinbase, WalletConnect

2. **Provider Wrapper Pattern** (40% of wallets)
   - Wrap wallet-specific providers into SwapKit interfaces
   - Minimal custom implementation
   - Examples: Keplr, Talisman, PolkadotJS

3. **Hybrid Pattern** (20% of wallets)
   - Mix custom signers for some chains, standard for others
   - Examples: CTRL, Exodus, OKX

4. **Special Pattern** (10% of wallets)
   - Non-standard implementations
   - Examples: Radix (custom API), Xaman (app-specific)

### Toolbox Override Patterns

1. **Heavy Override** (~15% of wallets): CTRL, Vultisig, KeepKey BEX
2. **Selective Override** (~25% of wallets): Exodus, Phantom, OKX, WalletConnect
3. **No Override** (~60% of wallets): Most wallets use standard toolboxes

### Common Override Methods

Most frequently overridden methods:
1. `transfer` - Custom transaction flows
2. `deposit` - THORChain/Maya specific
3. `getBalance` - Custom balance fetching
4. `signTransaction` - Chain-specific signing

## Recommendations

### For Standardization

1. **High Priority Wallets** (extensive custom implementations):
   - CTRL: Consider standardizing transfer methods
   - Vultisig: Evaluate if custom methods can use standard patterns
   - KeepKey BEX: Review necessity of custom balance methods

2. **Medium Priority** (partial customizations):
   - Standardize Solana transfer overrides (Exodus, Phantom)
   - Unify THORChain/Maya deposit patterns

3. **Low Priority** (working as intended):
   - Standard implementation wallets
   - Single-chain specialized wallets

### Architecture Patterns to Preserve

1. **Good Patterns**:
   - Custom signers for chains requiring special handling (BTC, Tron)
   - Provider wrapper pattern for standard chains
   - Clear separation of concerns

2. **Patterns to Review**:
   - Extensive method overrides that duplicate toolbox functionality
   - Inconsistent error handling across custom implementations