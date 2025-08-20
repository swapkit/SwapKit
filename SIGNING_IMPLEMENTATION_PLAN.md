# SwapKit Universal Signing Implementation Plan

## Executive Summary
Implement standardized `sign` and `signAndBroadcast` methods across all toolboxes and wallets to support:
- **PSBT signing** for UTXO chains
- **EVM transaction signing** for EVM chains  
- **Base64 encoded versioned transaction signing** for Solana

## Current State Analysis

### UTXO Chains (Bitcoin, Litecoin, Dogecoin, BitcoinCash, Zcash)
- ✅ Have `createTransaction` that builds PSBTs
- ✅ Have internal `signer.signTransaction(psbt)` capability
- ❌ Missing exposed `sign` method for PSBT-only signing
- ❌ Missing exposed `signAndBroadcast` method
- ✅ Have `transfer` that combines sign + broadcast

### EVM Chains (Ethereum, BSC, Avalanche, Polygon, Arbitrum, Optimism, Base)
- ✅ Have `sendTransaction` that handles sign + broadcast
- ✅ Have internal `signer.signTransaction` capability
- ❌ Missing exposed `sign` method for transaction objects
- ❌ Missing exposed `signAndBroadcast` method
- ✅ Have `transfer` that combines sign + broadcast

### Solana
- ✅ Have `signTransaction` method exposed
- ✅ Have `broadcastTransaction` method exposed
- ❌ Missing unified `signAndBroadcast` method
- ✅ Supports versioned transactions

## Implementation Tasks

### Phase 1: Core Toolbox Updates

#### 1.1 UTXO Toolbox Enhancement
**Files to modify:** 
- `packages/toolboxes/src/utxo/toolbox/utxo.ts`
- `packages/toolboxes/src/utxo/toolbox/bitcoinCash.ts`
- `packages/toolboxes/src/utxo/toolbox/zcash.ts`
- `packages/toolboxes/src/utxo/types.ts`

**Tasks:**
1. Add `sign` method to toolbox interface
   ```typescript
   sign: (psbt: Psbt) => Promise<Psbt>
   ```
2. Add `signAndBroadcast` method
   ```typescript
   signAndBroadcast: (psbt: Psbt) => Promise<string>
   ```
3. Update type definitions in `utxo/types.ts`
4. Implement methods in each UTXO toolbox variant

#### 1.2 EVM Toolbox Enhancement
**Files to modify:**
- `packages/toolboxes/src/evm/toolbox/baseEVMToolbox.ts`
- `packages/toolboxes/src/evm/toolbox/evm.ts`
- `packages/toolboxes/src/evm/toolbox/op.ts`
- `packages/toolboxes/src/evm/types.ts`

**Tasks:**
1. Add `sign` method to toolbox interface
   ```typescript
   sign: (tx: EVMTxParams) => Promise<string>
   ```
2. Add `signAndBroadcast` method
   ```typescript
   signAndBroadcast: (tx: EVMTxParams) => Promise<string>
   ```
3. Refactor existing `sendTransaction` to use new methods
4. Update type definitions

#### 1.3 Solana Toolbox Enhancement
**Files to modify:**
- `packages/toolboxes/src/solana/toolbox.ts`
- `packages/toolboxes/src/solana/index.ts`

**Tasks:**
1. Keep existing `signTransaction` as `sign` for consistency
   ```typescript
   sign: (
     transaction: Transaction | VersionedTransaction
   ) => Promise<Transaction | VersionedTransaction>
   ```
2. Add unified `signAndBroadcast` method
   ```typescript
   signAndBroadcast: (
     transaction: Transaction | VersionedTransaction
   ) => Promise<string>
   ```
3. Ensure versioned transaction support is documented
4. Add base64 encoding/decoding utilities

### Phase 2: Wallet Integration Updates

#### 2.1 Hardware Wallets
**Wallets:** Ledger, Trezor, KeepKey

**Tasks per wallet:**
1. Implement PSBT signing for UTXO chains
2. Implement EVM transaction signing
3. Add Solana support where applicable
4. Update wallet interfaces

#### 2.2 Browser Extension Wallets
**Wallets:** MetaMask, Coinbase, OKX, Phantom, Talisman, Exodus

**Tasks per wallet:**
1. Expose native signing methods through standardized interface
2. Handle chain-specific signing requirements
3. Add proper error handling and user cancellation

#### 2.3 Mobile Wallets
**Wallets:** WalletConnect, Xaman, Coinbase Mobile, OKX Mobile

**Tasks per wallet:**
1. Implement QR code or deep-link based signing
2. Handle async signing flows
3. Add timeout and retry logic

#### 2.4 Keystore Wallet
**Files:** `packages/wallets/src/keystore/`

**Tasks:**
1. Implement all signing methods directly
2. Add secure key management
3. Support all chain types

### Phase 3: Type System Updates

#### 3.1 Core Types
**Files to modify:**
- `packages/helpers/src/types/wallet.ts`
- `packages/toolboxes/src/types.ts`

**New interfaces:**
```typescript
interface SigningCapabilities {
  // Unified signing interface - same method names across all chains
  sign?: (
    transaction: Psbt | EVMTxParams | Transaction | VersionedTransaction
  ) => Promise<Psbt | string | Transaction | VersionedTransaction>;
  
  signAndBroadcast?: (
    transaction: Psbt | EVMTxParams | Transaction | VersionedTransaction
  ) => Promise<string>;
}
```

### Phase 4: Testing & Documentation

#### 4.1 Unit Tests
**Files to create/modify:**
- `packages/toolboxes/src/utxo/__tests__/signing.test.ts`
- `packages/toolboxes/src/evm/__tests__/signing.test.ts`
- `packages/toolboxes/src/solana/__tests__/signing.test.ts`

#### 4.2 Integration Tests
- Test each wallet with each supported chain
- Test error scenarios (user rejection, timeout, etc.)
- Test with mainnet forks

#### 4.3 Documentation
- Update API documentation
- Create migration guide for existing integrations
- Add code examples for each signing method

## Implementation Order

### Week 1: Core Toolbox Updates
1. **Day 1-2:** UTXO toolbox signing methods
2. **Day 3-4:** EVM toolbox signing methods
3. **Day 5:** Solana toolbox refinements

### Week 2: Wallet Integrations (Priority 1)
1. **Day 1-2:** Ledger wallet
2. **Day 3:** MetaMask & Coinbase wallets
3. **Day 4:** Phantom wallet
4. **Day 5:** WalletConnect

### Week 3: Wallet Integrations (Priority 2)
1. **Day 1:** OKX wallet
2. **Day 2:** Trezor & KeepKey
3. **Day 3:** Keystore wallet
4. **Day 4-5:** Remaining wallets

### Week 4: Testing & Documentation
1. **Day 1-2:** Unit test implementation
2. **Day 3:** Integration test implementation
3. **Day 4-5:** Documentation and examples

## Success Criteria

1. **Consistency:** All toolboxes expose the same signing interface
2. **Compatibility:** All wallets work with all supported chains
3. **Type Safety:** Full TypeScript coverage with no `any` types
4. **Testing:** >90% code coverage for new methods
5. **Documentation:** Complete API docs and migration guide

## Risk Mitigation

### Technical Risks
- **Hardware wallet limitations:** Some hardware wallets may not support all chains
  - *Mitigation:* Document supported chains per wallet
  
- **Breaking changes:** Existing integrations might break
  - *Mitigation:* Keep existing methods, deprecate gradually

- **Async signing flows:** Mobile wallets have complex async patterns
  - *Mitigation:* Implement robust timeout and retry logic

### Timeline Risks
- **Wallet vendor changes:** External wallet APIs might change
  - *Mitigation:* Pin wallet SDK versions, monitor changelogs

- **Testing complexity:** Testing all combinations is time-consuming
  - *Mitigation:* Prioritize critical paths, use test matrices

## Monitoring & Rollout

### Rollout Strategy
1. **Beta release:** Release as `@next` tag for early adopters
2. **Gradual migration:** Provide compatibility layer
3. **Full release:** After 2 weeks of beta testing

### Monitoring
- Track signing success rates per wallet/chain
- Monitor error rates and types
- Collect user feedback through GitHub issues

## Appendix: Detailed File Changes

### UTXO Toolbox Changes

#### `/packages/toolboxes/src/utxo/toolbox/utxo.ts`
```typescript
// Add to toolbox return object:
sign: async (psbt: Psbt): Promise<Psbt> => {
  if (!signer) throw new SwapKitError("toolbox_utxo_no_signer");
  const signedPsbt = await signer.signTransaction(psbt);
  return signedPsbt;
},

signAndBroadcast: async (psbt: Psbt): Promise<string> => {
  if (!signer) throw new SwapKitError("toolbox_utxo_no_signer");
  const signedPsbt = await signer.signTransaction(psbt);
  signedPsbt.finalizeAllInputs();
  const txHex = signedPsbt.extractTransaction().toHex();
  return broadcastTx(txHex);
},
```

### EVM Toolbox Changes

#### `/packages/toolboxes/src/evm/toolbox/baseEVMToolbox.ts`
```typescript
// Add to BaseEVMToolbox return object:
sign: async (tx: EVMTxParams): Promise<string> => {
  if (!signer) throw new SwapKitError("toolbox_evm_no_signer");
  const signedTx = await signer.signTransaction(tx);
  return signedTx;
},

signAndBroadcast: async (tx: EVMTxParams): Promise<string> => {
  const signedTx = await sign(tx);
  const response = await provider.broadcastTransaction(signedTx);
  return response.hash;
},
```

### Solana Toolbox Changes

#### `/packages/toolboxes/src/solana/toolbox.ts`
```typescript
// Note: signTransaction already exists, rename it to sign for consistency
// Add to toolbox return object:
sign: signTransaction(getConnection, signer), // Alias existing signTransaction

signAndBroadcast: async (
  transaction: Transaction | VersionedTransaction
): Promise<string> => {
  const signedTx = await signTransaction(getConnection, signer)(transaction);
  return broadcastTransaction(getConnection)(signedTx);
},

// Add base64 utilities:
serializeTransaction: (tx: Transaction | VersionedTransaction): string => {
  return Buffer.from(tx.serialize()).toString('base64');
},

deserializeTransaction: (
  base64: string
): Transaction | VersionedTransaction => {
  const buffer = Buffer.from(base64, 'base64');
  // Detect and deserialize based on version
  return VersionedTransaction.deserialize(buffer);
},
```

## Notes

- All signing methods should be optional on interfaces to maintain backward compatibility
- Error messages should be chain-specific for better debugging
- Consider adding signing method capability detection
- Hardware wallet support matrix should be documented clearly
