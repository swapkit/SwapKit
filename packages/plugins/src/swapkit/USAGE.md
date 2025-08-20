# SwapKit Plugin Usage Guide

The SwapKit plugin enables swapping through the SwapKit API with automatic handling of transaction signing and broadcasting.

## Features

- **Quote fetching** from SwapKit API
- **Automatic transaction signing** for supported wallets
- **Fallback to transfer method** for wallets without signing support (CTRL, Vultisig, KeepKey-BEX)
- **Multi-chain support** (Bitcoin, Ethereum, Solana, Cosmos, etc.)

## Basic Usage

```typescript
import { createSwapKit } from '@swapkit/core';
import { SwapKitPlugin } from '@swapkit/plugins/swapkit';

// Initialize SwapKit with the plugin
const swapKit = createSwapKit({
  plugins: {
    ...SwapKitPlugin,
  },
  config: {
    // Your config
  }
});

// Connect wallet
await swapKit.connectWallet(WalletOption.METAMASK, [Chain.Ethereum]);

// Get a quote
const quote = await swapKit.swapkit.quote({
  sellAsset: 'ETH.ETH',
  buyAsset: 'BTC.BTC',
  sellAmount: '1000000000000000000', // 1 ETH in wei
  sourceAddress: '0x...', // Your ETH address
  destinationAddress: 'bc1q...', // Your BTC address
  slippage: 3, // 3% slippage
  affiliate: 'YOUR_AFFILIATE',
  affiliateBasisPoints: 100, // 1%
});

// Execute the swap
const txHash = await swapKit.swapkit.swap({
  route: quote,
  recipient: 'bc1q...', // Optional, uses route's destination by default
});

console.log('Swap transaction:', txHash);
```

## Wallet-Specific Behavior

### Wallets with Full Signing Support

For wallets like MetaMask, Ledger, Trezor, Exodus, Phantom, OKX, OneKey, etc.:

```typescript
// The plugin will automatically use signAndBroadcastTransaction
const txHash = await swapKit.swapkit.swap({ route });
// Transaction is signed and broadcast directly
```

### Wallets without Signing Support

For wallets like CTRL, Vultisig, and KeepKey-BEX:

```typescript
// The plugin automatically falls back to the transfer method
const txHash = await swapKit.swapkit.swap({ route });
// Behind the scenes, it uses wallet.transfer() with params from SwapKit API
```

## Advanced Usage

### Checking Wallet Capabilities

```typescript
// Check if a wallet supports signing
const supportsSigniing = swapKit.swapkit.walletSupportsSignAndBroadcast(WalletOption.CTRL);
console.log('CTRL supports signing:', supportsSigniing); // false
```

### Override SignAndBroadcast for Non-Supporting Wallets

```typescript
// Get wallet instance
const wallet = swapKit.getWallet(Chain.Bitcoin);

// Override signAndBroadcastTransaction if needed
const enhancedWallet = swapKit.swapkit.overrideSignAndBroadcastForWallet(
  wallet,
  Chain.Bitcoin
);
```

## Transaction Types by Chain

### UTXO Chains (Bitcoin, Litecoin, Dogecoin, etc.)

```typescript
// SwapKit API provides PSBT (Partially Signed Bitcoin Transaction)
// Plugin handles:
const psbt = Psbt.fromHex(transactionData.psbt);
await wallet.signAndBroadcastTransaction(psbt);
```

### EVM Chains (Ethereum, Avalanche, BSC, etc.)

```typescript
// SwapKit API provides transaction parameters
// Plugin creates ethers.js TransactionRequest:
const txRequest = {
  to: transactionData.to,
  data: transactionData.data,
  value: BigInt(transactionData.value),
  gasLimit: BigInt(transactionData.gas),
  gasPrice: BigInt(transactionData.gasPrice),
};
await wallet.signAndBroadcastTransaction(txRequest);
```

### Solana

```typescript
// SwapKit API provides base64 encoded transaction
// Plugin handles versioned and legacy transactions:
const tx = VersionedTransaction.deserialize(buffer);
await wallet.signAndBroadcastTransaction(tx);
```

### Cosmos Chains (THORChain, Maya, Cosmos, etc.)

```typescript
// Typically uses transfer with memo
await wallet.transfer({
  recipient: route.destination,
  assetValue: sellAsset,
  memo: route.memo,
});
```

## Error Handling

```typescript
try {
  const quote = await swapKit.swapkit.quote({
    sellAsset: 'ETH.ETH',
    buyAsset: 'BTC.BTC',
    sellAmount: '1000000000000000000',
  });
  
  const txHash = await swapKit.swapkit.swap({ route: quote });
  console.log('Success:', txHash);
} catch (error) {
  if (error.errorKey === 'core_quote_failed') {
    console.error('Failed to get quote:', error);
  } else if (error.errorKey === 'core_swap_failed') {
    console.error('Failed to execute swap:', error);
  } else if (error.errorKey === 'core_wallet_feature_not_supported') {
    console.error('Wallet doesn\'t support this operation:', error);
  }
}
```

## Testing with Different Wallets

```typescript
// Test with a wallet that supports signing
await swapKit.connectWallet(WalletOption.METAMASK, [Chain.Ethereum]);
const txHash1 = await swapKit.swapkit.swap({ route: ethRoute });

// Test with a wallet that doesn't support signing
await swapKit.connectWallet(WalletOption.CTRL, [Chain.Bitcoin]);
const txHash2 = await swapKit.swapkit.swap({ route: btcRoute });
// Automatically uses transfer fallback
```

## Configuration

The plugin automatically detects wallet capabilities and uses the appropriate method:

1. **Primary method**: `signAndBroadcastTransaction` for wallets with full signing support
2. **Fallback method**: `transfer` for wallets without signing support

No additional configuration is needed - the plugin handles everything automatically based on the connected wallet type.