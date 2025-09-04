# Solana Toolbox Signing Methods Analysis

## Current State

The Solana toolbox (`/Users/damian/Workspace/Crypto/Thorswap/SwapKit/packages/toolboxes/src/solana/toolbox.ts`) currently implements **2 out of 3** requested signing methods:

### ✅ Methods that Exist

#### 1. `signTransaction`
**Location**: Line 137 in toolbox return object, implementation at lines 353-376
**Signature**: 
```typescript
signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
```
**Implementation Details**:
- Takes a `Transaction` or `VersionedTransaction` as input
- Handles both wallet provider signers (`signer.signTransaction()`) and direct signers (`transaction.sign([signer])`)
- Automatically sets `recentBlockhash` and `feePayer` for regular transactions
- Returns the signed transaction object
- Throws `SwapKitError("toolbox_solana_no_signer")` if no signer is available

#### 2. `signAndBroadcastTransaction`
**Location**: Line 133-136 in toolbox return object
**Signature**:
```typescript
signAndBroadcastTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>
```
**Implementation Details**:
- Combines signing and broadcasting in a single method
- First calls `signTransaction()` to sign the transaction
- Then calls `broadcastTransaction()` to submit to the network
- Returns the transaction hash as a string
- Uses the same signing logic as `signTransaction`

## Missing Methods

### ❌ `signMessage`
**Status**: **Not implemented** in the toolbox return object

**Note**: While the `SolanaProvider` interface (in `index.ts`) defines a `signMessage` method:
```typescript
signMessage: (message: Uint8Array | string, display?: DisplayEncoding) => Promise<any>
```

This method is **not exposed** in the actual toolbox object returned by `getSolanaToolbox()`. It's only available as part of the provider interface for wallet integrations, but not as a direct toolbox method.

## Implementation Signatures for Reference

### Current Signatures
```typescript
// ✅ Implemented
signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>

// ✅ Implemented  
signAndBroadcastTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>

// ❌ Missing from toolbox (but exists in SolanaProvider interface)
signMessage: (message: Uint8Array | string, display?: DisplayEncoding) => Promise<any>
```

### Supporting Infrastructure
The toolbox has all necessary infrastructure for signing:
- ✅ Signer management (`SolanaSigner` type supporting both providers and direct signers)
- ✅ Connection management (`getConnection()`)
- ✅ Error handling with SwapKit errors
- ✅ Transaction broadcasting (`broadcastTransaction()`)

## Recommendation

To complete the signing method suite, the `signMessage` method should be added to the toolbox return object in the `getSolanaToolbox()` function. The implementation should handle both provider-based signers (using `signer.signMessage()`) and direct signers appropriately.