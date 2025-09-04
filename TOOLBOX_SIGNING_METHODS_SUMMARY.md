# SwapKit Toolbox Signing Methods Summary

## Overview
This document summarizes the analysis of signing methods across all SwapKit toolboxes. The goal is to standardize the following three methods across all chains:

1. **signTransaction** - Signs a transaction and returns the signed transaction
2. **signAndBroadcastTransaction** - Signs and broadcasts a transaction, returns the tx hash
3. **signMessage** - Signs a message for authentication/verification

## Reference Implementation (EVM & UTXO)

### EVM Toolbox ✅ Complete
```typescript
signTransaction: (tx: TransactionRequest) => Promise<string>
signAndBroadcastTransaction: (tx: TransactionRequest) => Promise<string>
signMessage: (message: string) => Promise<string>
```

### UTXO Toolbox ✅ Complete
```typescript
signTransaction: (psbt: Psbt) => Promise<Psbt>
signAndBroadcastTransaction: (psbt: Psbt) => Promise<string>
// Note: BCH uses different signatures with TransactionBuilderType
```

## Toolbox Status Summary

| Toolbox | signTransaction | signAndBroadcastTransaction | signMessage | Notes |
|---------|----------------|----------------------------|-------------|-------|
| **EVM** | ✅ Implemented | ✅ Implemented | ✅ Implemented | Complete implementation |
| **UTXO** | ✅ Implemented | ✅ Implemented | ❌ Missing | No signMessage method |
| **Solana** | ✅ Implemented | ✅ Implemented | ❌ Missing | signMessage in provider but not toolbox |
| **Cosmos** | ❌ Missing | ✅ Implemented (THORChain only) | ❌ Missing | Explicitly omitted from types |
| **Tron** | ✅ Implemented | ❌ Missing | ❌ Missing | Has separate sign + broadcast |
| **Near** | ✅ Implemented | ❌ Missing | ❌ Missing | Has separate sign + broadcast |
| **Ripple** | ✅ Implemented | ❌ Missing | ❌ Missing | Has separate sign + broadcast |
| **Substrate** | ✅ `sign` | ✅ `signAndBroadcast` | ❌ Missing | Different naming convention |
| **Radix** | ❌ Missing | ❌ Missing* | ❌ Missing | *Has error-throwing placeholder |

## Implementation Priority

### High Priority (Core Functionality Missing)
1. **Radix** - Needs all three methods implemented
2. **Cosmos** - Needs signTransaction and signMessage

### Medium Priority (Convenience Methods)
1. **Tron** - Add signAndBroadcastTransaction, signMessage
2. **Near** - Add signAndBroadcastTransaction, signMessage  
3. **Ripple** - Add signAndBroadcastTransaction, signMessage

### Low Priority (Message Signing)
1. **UTXO** - Add signMessage
2. **Solana** - Expose signMessage from provider to toolbox
3. **Substrate** - Add signMessage (consider renaming to match standard)

## Recommended Method Signatures

### signTransaction
```typescript
// Generic signature
signTransaction: (transaction: ChainSpecificTransaction) => Promise<SignedTransaction>

// Examples:
// Tron: (transaction: TronTransaction) => Promise<TronSignedTransaction>
// Near: (transaction: Transaction) => Promise<SignedTransaction>
// Ripple: (tx: Transaction) => Promise<{ tx_blob: string; hash: string }>
```

### signAndBroadcastTransaction
```typescript
// Generic signature
signAndBroadcastTransaction: (transaction: ChainSpecificTransaction) => Promise<string>

// Should combine existing signTransaction + broadcastTransaction
```

### signMessage
```typescript
// Generic signature
signMessage: (message: string) => Promise<string>

// Returns signature as hex/base64 string
```

## Implementation Notes

1. **Error Handling**: All methods should throw `SwapKitError` with appropriate error keys when signer is not available
2. **Signer Validation**: Check for signer existence before attempting any signing operation
3. **Return Values**: signAndBroadcastTransaction should always return transaction hash as string
4. **Async/Await**: All signing methods should be async functions
5. **Type Safety**: Maintain chain-specific transaction types

## Files Analyzed

- `/packages/toolboxes/src/evm/toolbox/baseEVMToolbox.ts`
- `/packages/toolboxes/src/utxo/toolbox/utxo.ts`
- `/packages/toolboxes/src/solana/toolbox.ts`
- `/packages/toolboxes/src/cosmos/toolbox/cosmos.ts`
- `/packages/toolboxes/src/cosmos/toolbox/thorchain.ts`
- `/packages/toolboxes/src/tron/toolbox.ts`
- `/packages/toolboxes/src/near/toolbox.ts`
- `/packages/toolboxes/src/ripple/index.ts`
- `/packages/toolboxes/src/substrate/toolbox.ts`
- `/packages/toolboxes/src/radix/toolbox.ts`