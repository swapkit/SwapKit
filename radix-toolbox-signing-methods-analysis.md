# Radix Toolbox Signing Methods Analysis

## Current State

The Radix toolbox (`/Users/damian/Workspace/Crypto/Thorswap/SwapKit/packages/toolboxes/src/radix/index.ts`) currently has **very limited** signing functionality implemented:

### Existing Methods

**✅ signAndBroadcast** - Partially implemented but throws an error
- **Location**: Line 127-129
- **Implementation**: 
  ```typescript
  signAndBroadcast: (() => {
    throw new SwapKitError("toolbox_radix_method_not_supported", { method: "signAndBroadcast" });
  }) as (params: any) => Promise<string>
  ```
- **Status**: Present but non-functional (throws error)
- **Return Type**: `Promise<string>`

### Other Available Methods
- `getAddress()` - Returns empty string (line 124)
- `getBalance()` - Functional implementation for fetching balances (line 125)  
- `validateAddress()` - Functional implementation (line 130)

## Missing Methods

**❌ signTransaction** - Not implemented
- **Expected signature**: `(transaction: RadixTransaction) => Promise<SignedRadixTransaction>`
- **Purpose**: Sign a transaction and return the signed transaction without broadcasting
- **Status**: Completely missing

**❌ signMessage** - Not implemented  
- **Expected signature**: `(message: string) => Promise<string>`
- **Purpose**: Sign an arbitrary message for authentication/verification
- **Status**: Completely missing

**❌ signAndBroadcastTransaction** - Not implemented
- **Expected signature**: `(transaction: RadixTransaction) => Promise<string>`
- **Purpose**: Sign and broadcast a transaction, returning the transaction hash
- **Status**: Missing (only `signAndBroadcast` exists and throws error)

## Implementation Signatures for Reference

Based on patterns from other toolboxes (EVM, Solana, Tron), the expected signatures should be:

```typescript
export const RadixToolbox = async ({ dappConfig }: { dappConfig?: SKConfigIntegrations["radix"] } = {}) => {
  // ... existing implementation ...
  
  return {
    // ... existing methods ...
    
    // Missing methods that should be implemented:
    signTransaction: async (transaction: RadixTransactionManifest): Promise<RadixSignedTransaction> => {
      // Implementation needed
    },
    
    signAndBroadcastTransaction: async (transaction: RadixTransactionManifest): Promise<string> => {
      // Implementation needed - should return tx hash
    },
    
    signMessage: async (message: string): Promise<string> => {
      // Implementation needed
    }
  };
};
```

## Comparison with Other Toolboxes

**EVM Toolbox** (fully implemented):
- ✅ `signTransaction: (tx: TransactionRequest) => Promise<string>`
- ✅ `signAndBroadcastTransaction: (tx: TransactionRequest) => Promise<string>`  
- ✅ `signMessage: (message: string) => Promise<string>`

**Solana Toolbox** (fully implemented):
- ✅ `signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<T>`
- ✅ `signAndBroadcastTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>`

**Tron Toolbox** (fully implemented):
- ✅ `signTransaction: (transaction: TronTransaction) => Promise<TronSignedTransaction>`

## Summary

The Radix toolbox is currently **incomplete** for transaction signing functionality:

- **0 of 3** required signing methods are properly implemented
- Only a stub `signAndBroadcast` exists that throws an error
- All three core signing methods (`signTransaction`, `signAndBroadcastTransaction`, `signMessage`) need to be implemented
- The toolbox needs integration with Radix Dapp Toolkit's signing capabilities to provide full functionality

## Next Steps

We skip this as the chain is very unimportant right now.
