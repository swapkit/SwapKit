# Tron Toolbox Signing Methods Analysis

## Current State

### Existing Methods

The Tron toolbox (`/Users/damian/Workspace/Crypto/Thorswap/SwapKit/packages/toolboxes/src/tron/toolbox.ts`) currently implements:

#### 1. ✅ `signTransaction` - **EXISTS**
- **Location**: Line 509-512 in toolbox.ts
- **Return Type**: `Promise<TronSignedTransaction>`
- **Implementation**: 
  ```typescript
  const signTransaction = async (transaction: TronTransaction) => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");
    return await signer.signTransaction(transaction);
  };
  ```
- **Signature**: `signTransaction: (transaction: TronTransaction) => Promise<TronSignedTransaction>;`
- **Status**: Fully implemented and exported from the toolbox

## Missing Methods

### 1. ❌ `signAndBroadcastTransaction` - **MISSING**
- **Expected Signature**: `signAndBroadcastTransaction: (transaction: TronTransaction) => Promise<string>;`
- **Expected Behavior**: Should sign a transaction and immediately broadcast it, returning the transaction hash
- **Current Workaround**: Users must call `signTransaction()` followed by `broadcastTransaction()` separately

### 2. ❌ `signMessage` - **MISSING**
- **Expected Signature**: `signMessage: (message: string) => Promise<string>;`
- **Expected Behavior**: Should sign an arbitrary message and return the signature
- **Notes**: This would be useful for authentication and verification purposes

## Implementation Signatures for Reference

### Currently Available Methods
```typescript
// ✅ Available - Signs a transaction
signTransaction: (transaction: TronTransaction) => Promise<TronSignedTransaction>;

// ✅ Available - Broadcasts an already signed transaction  
broadcastTransaction: (signedTransaction: TronSignedTransaction) => Promise<string>;
```

### Missing Methods (Expected Signatures)
```typescript
// ❌ Missing - Signs and broadcasts in one call
signAndBroadcastTransaction: (transaction: TronTransaction) => Promise<string>;

// ❌ Missing - Signs arbitrary messages
signMessage: (message: string) => Promise<string>;
```

## Related Types

The toolbox uses the following relevant types:
- `TronTransaction` - Transaction object from TronWeb
- `TronSignedTransaction` - Signed transaction object from TronWeb  
- `TronSigner` interface with methods:
  - `getAddress(): Promise<string>`
  - `signTransaction(transaction: TronTransaction): Promise<TronSignedTransaction>`

## Conclusion

The Tron toolbox currently has **1 out of 3** requested signing methods implemented:
- ✅ `signTransaction` - Fully implemented
- ❌ `signAndBroadcastTransaction` - Missing (would be a convenience method)
- ❌ `signMessage` - Missing (would require TronWeb message signing support)

The existing `signTransaction` method works in conjunction with `broadcastTransaction` to achieve the same result as the missing `signAndBroadcastTransaction` method, but requires two separate calls.