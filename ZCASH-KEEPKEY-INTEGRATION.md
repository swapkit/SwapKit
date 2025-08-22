# KeepKey Zcash Integration Guide

## Current Status
KeepKey hardware wallet currently **excludes** Zcash support in SwapKit despite having a complete UTXO infrastructure.

## Integration Path

### Step 1: Remove Explicit Exclusion
**File**: `packages/wallet-hardware/src/keepkey/chains/utxo.ts`
**Line**: 32

Current code:
```typescript
chain: Exclude<UTXOChain, Chain.Zcash>
```

Change to:
```typescript
chain: UTXOChain
```

### Step 2: Add Zcash Coin Mapping
**File**: `packages/wallet-hardware/src/keepkey/chains/utxo.ts`

Add Zcash to the coin mapping:
```typescript
const coinMap = {
  // ... existing mappings
  [Chain.Zcash]: "Zcash",
};
```

### Step 3: Verify KeepKey SDK Support
Check if `@keepkey/hdwallet-keepkey` supports Zcash:
- Review KeepKey firmware capabilities
- Ensure BIP44 path support for coin type 133
- Verify transparent address generation

### Step 4: Test Transaction Signing
Implement test cases:
```typescript
// Test transparent address generation
const address = await keepkey.getAddress({
  addressNList: [0x80000000 + 44, 0x80000000 + 133, 0x80000000 + 0, 0, 0],
  coin: "Zcash",
  showDisplay: false,
});

// Test PSBT signing
const signedPsbt = await keepkey.signTransaction({
  psbt: unsignedPsbt,
  coin: "Zcash",
});
```

### Step 5: Integration Points
1. **Address Generation**: Use existing UTXO address generation flow
2. **Transaction Creation**: Leverage existing PSBT builder
3. **Signing**: Use KeepKey's PSBT signing interface
4. **Broadcasting**: Use existing Zcash toolbox broadcast

## Technical Considerations

### Supported Features
- ✅ Transparent addresses (t1... for mainnet, t3... for testnet)
- ✅ PSBT-based transaction signing
- ✅ BIP44 derivation path
- ✅ Standard UTXO operations

### Not Supported
- ❌ Shielded addresses (z-addresses)
- ❌ Shielded transactions
- ❌ Memo fields (unless via OP_RETURN)

## Implementation Checklist
- [ ] Remove Zcash exclusion from type definition
- [ ] Add Zcash coin mapping
- [ ] Verify KeepKey firmware version requirements
- [ ] Implement address generation
- [ ] Implement transaction signing
- [ ] Add integration tests
- [ ] Update documentation
- [ ] Test with mainnet and testnet

## Risk Assessment
- **Low Risk**: Uses existing UTXO infrastructure
- **Medium Risk**: KeepKey SDK may need updates
- **Mitigation**: Test thoroughly with small amounts first

## Estimated Timeline
- Development: 2-3 days
- Testing: 2 days
- Documentation: 1 day
- **Total**: ~1 week

## Dependencies
- KeepKey firmware support for Zcash
- `@keepkey/hdwallet-keepkey` library support
- Existing Zcash toolbox implementation

## Testing Strategy
1. Unit tests for address generation
2. Integration tests for transaction creation and signing
3. E2E tests with actual KeepKey device
4. Mainnet/testnet validation