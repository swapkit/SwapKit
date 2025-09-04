# Substrate Toolbox Signing Methods Analysis

## Current State

The Substrate toolbox (`/packages/toolboxes/src/substrate/substrate.ts`) currently implements **2 of 3** required signing methods:

### ✅ Existing Methods

#### 1. `sign` - Transaction Signing Method
**Status**: ✅ **Implemented**

```typescript
sign: (tx: SubmittableExtrinsic<"promise">) => {
  if (!signer) throw new SwapKitError("core_wallet_not_keypair_wallet");
  if (isKeyringPair(signer)) return sign(signer, tx);

  throw new SwapKitError(
    "core_wallet_not_keypair_wallet",
    "Signer does not have keyring pair capabilities required for signing.",
  );
}
```

**Implementation Details**:
- Takes a `SubmittableExtrinsic<"promise">` (transaction object)
- Returns a signed transaction using `tx.signAsync(signer)`
- Only works with KeyringPair signers, not external wallet signers
- Throws error if no signer is available or if signer lacks keyring capabilities

#### 2. `signAndBroadcast` - Sign and Broadcast Method  
**Status**: ✅ **Implemented**

```typescript
signAndBroadcast: ({
  tx,
  callback,
  address,
}: {
  tx: SubmittableExtrinsic<"promise">;
  callback?: Callback<ISubmittableResult>;
  address?: string;
}) => {
  if (!signer) throw new SwapKitError("core_wallet_not_keypair_wallet");
  if (isKeyringPair(signer)) return signAndBroadcastKeyring(signer, tx, callback);

  if (address) {
    return signAndBroadcast({ address, api, callback, signer, tx });
  }

  throw new SwapKitError(
    "core_wallet_not_keypair_wallet",
    "Signer does not have keyring pair capabilities required for signing.",
  );
}
```

**Implementation Details**:
- Takes transaction object, optional callback, and optional address
- Returns transaction hash as string
- Supports both KeyringPair and external wallet signers
- Uses `tx.signAndSend()` internally
- Handles nonce calculation automatically

### ❌ Missing Methods

#### 1. `signMessage` - Message Signing Method
**Status**: ❌ **Not Implemented**

**Expected Signature** (based on other toolboxes):
```typescript
signMessage: (message: string) => Promise<string>
```

**What's Missing**:
- No message signing capability exists in the toolbox
- Would need to use Polkadot.js keyring or signer's message signing functionality
- Should support both raw message signing and structured message formats

## Method Name Mapping

The Substrate toolbox uses slightly different naming conventions than the requested standard:

| Requested Method | Substrate Implementation | Status |
|------------------|-------------------------|---------|
| `signTransaction` | `sign` | ✅ Equivalent functionality |
| `signAndBroadcastTransaction` | `signAndBroadcast` | ✅ Equivalent functionality |
| `signMessage` | ❌ Not implemented | ❌ Missing |

## Implementation Notes

### Signer Support
The toolbox supports two types of signers:
- **KeyringPair**: Local keypairs created from seed phrases
- **External Signers**: Wallet-provided signers (Polkadot.js extension wallets)

### Transaction Handling
- Uses Polkadot.js `SubmittableExtrinsic` objects for transactions
- Automatically handles nonce calculation via `api.rpc.system.accountNextIndex`
- Supports callback-based monitoring of transaction status

### Error Handling
- Consistent error handling using `SwapKitError`
- Specific error codes for wallet/signer issues
- Clear error messages for debugging

## Summary

- **2 of 3** required signing methods are implemented with equivalent functionality
- Transaction signing methods are fully functional and support both local and external signers  
- Message signing capability is completely missing
- The existing implementations follow Substrate/Polkadot patterns and integrate well with the ecosystem
- Method names differ slightly from standard but provide the same core functionality