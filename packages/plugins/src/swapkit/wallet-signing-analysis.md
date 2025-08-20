# Wallet Signing Capabilities Analysis

## Wallets that DON'T support signing (need special handling)

### 1. **CTRL Wallet**
- **Chains affected**: Bitcoin, BitcoinCash, Dogecoin, Litecoin, THORChain, Maya, Near
- **Implementation**: Uses `walletTransfer` for UTXO chains, custom transfer methods for others
- **Special handling needed**: Yes - will need to use transfer method with SwapKit API params

### 2. **Vultisig Wallet**
- **Chains affected**: All supported chains
- **Implementation**: Uses `walletTransfer` throughout
- **Special handling needed**: Yes - will need to use transfer method with SwapKit API params

### 3. **KeepKey-BEX Wallet**
- **Chains affected**: All supported chains
- **Implementation**: Uses `walletTransfer`
- **Special handling needed**: Yes - will need to use transfer method with SwapKit API params

## Wallets that DO support signing

### 1. **Exodus**
- **Bitcoin**: ✅ Has `signTransaction` via sats-connect
- **EVM chains**: ✅ Standard ethers.js signer
- **Special handling needed**: No

### 2. **Phantom**
- **Bitcoin**: ✅ Uses toolbox directly (has signing)
- **Ethereum**: ✅ Standard ethers.js signer
- **Solana**: ✅ Uses provider.signTransaction
- **Special handling needed**: No

### 3. **OKX**
- **Bitcoin**: ✅ Has `signTransaction` via wallet.signPsbt
- **EVM chains**: ✅ Standard ethers.js signer
- **Cosmos**: ⚠️ Uses custom cosmosTransfer
- **Near**: ✅ Has signer
- **Solana**: ✅ Has signing
- **Special handling needed**: Only for Cosmos

### 4. **OneKey**
- **All chains**: ✅ Has signing capabilities
- **Special handling needed**: No

### 5. **TronLink**
- **Tron**: ✅ Has signing capabilities
- **Special handling needed**: No

### 6. **WalletConnect**
- **EVM chains**: ✅ Has EVM signer
- **Other chains**: ✅ Standard signing
- **Special handling needed**: No

### 7. **Coinbase**
- **All supported chains**: ✅ Has signer implementation
- **Special handling needed**: No

### 8. **Bitget**
- **All supported chains**: ✅ Has signing helpers
- **Special handling needed**: No

### 9. **Ledger** (Hardware)
- **All chains**: ✅ Full signing support via hardware
- **Special handling needed**: No

### 10. **Trezor** (Hardware)
- **All chains**: ✅ Full signing support via hardware
- **Special handling needed**: No

### 11. **Keplr**
- **Cosmos chains**: ✅ Has signing
- **Special handling needed**: No

### 12. **Cosmostation**
- **Cosmos chains**: ✅ Has signing
- **Special handling needed**: No

### 13. **Xaman**
- **XRP/Ripple**: ✅ Has signing
- **Special handling needed**: No

### 14. **Polkadot.js**
- **Polkadot/Substrate**: ✅ Has signing
- **Special handling needed**: No

### 15. **Talisman**
- **Polkadot/Substrate**: ✅ Has signing
- **Special handling needed**: No

### 16. **Radix**
- **Radix**: ✅ Has signing
- **Special handling needed**: No

### 17. **Keystore**
- **All chains**: ✅ Has signing (software wallet)
- **Special handling needed**: No

### 18. **EVM Extensions** (MetaMask, etc.)
- **EVM chains**: ✅ Standard ethers.js signer
- **Special handling needed**: No

## Summary

**Wallets needing special handling:**
- CTRL
- Vultisig
- KeepKey-BEX
- OKX (Cosmos only)

For these wallets, we'll need to:
1. Detect if the wallet doesn't support `signAndBroadcastTransaction`
2. Fall back to using the `transfer` method with parameters from SwapKit API
3. Override the `signAndBroadcastTransaction` method to use the fallback