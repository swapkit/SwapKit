# NEAR Wallet Selector Integration - Progress Report

## Completed Steps

### 1. ✅ Added wallet modules to package.json
- Added `@near-wallet-selector/here-wallet`
- Added `@near-wallet-selector/my-near-wallet`
- Added `@near-wallet-selector/nightly`
- Added `@near-wallet-selector/sender`
- Updated both dependencies and devDependencies sections
- Ran `bun install` - all packages installed successfully

### 2. ✅ Created `/packages/wallets/src/near-wallet-selector/index.ts`
- Implemented `createNearSigner(wallet)` adapter function
- Implemented `getWalletMethods()` helper function
- Implemented `walletSelector` using `createWallet` pattern
- Exported `WALLET_SELECTOR_SUPPORTED_CHAINS`

## Current Issues to Fix

### Type Errors
1. **SKConfig integration type missing**: Need to add `nearWalletSelector` to `SKConfigIntegrations` type
   - Location: `packages/helpers/src/types/config.ts` or similar
   - Add: `nearWalletSelector?: { contractId?: string }`

2. **Async function without await** (Biome lint issue):
   - Line 25: `getPublicKey` - can remove async or add await Promise.resolve()

### Remaining TODO Items
- [ ] Fix SKConfig type definition for nearWalletSelector
- [ ] Fix async/await linting issues
- [ ] Add package.json export entry for near-wallet-selector
- [ ] Export walletSelector from main index (`packages/wallets/src/index.ts`)
- [ ] Run build and type-check
- [ ] Test the integration

## Implementation Details

### Pattern Used
Following existing wallet patterns (phantom, tronlink, exodus):
- No classes, only functions
- Uses `createWallet` from `@swapkit/wallet-core`
- Uses `filterSupportedChains` helper
- Proper error handling with `SwapKitError`
- Cleanup on disconnect

### Configuration
- Network: hardcoded to "mainnet" (as requested)
- ContractId: from `SKConfig.get("integrations")?.nearWalletSelector?.contractId ?? "swapkit.near"`
- Wallet modules enabled:
  - MyNearWallet
  - Meteor
  - Sender
  - HERE Wallet
  - Nightly

### NearSigner Adapter
The `createNearSigner` function maps NEAR Wallet Selector's wallet interface to SwapKit's NearSigner:
- `getAddress()` → from `wallet.getAccounts()[0].accountId`
- `signMessage()` → `wallet.signMessage()`
- `signTransaction()` → `wallet.signAndSendTransaction()`
- `signTransactions()` → `wallet.signAndSendTransactions()`
- Unsupported methods throw `wallet_near_method_not_supported` error

## Next Steps for YOLO Mode

1. Fix SKConfig type by adding to helpers config types
2. Fix async functions (remove async or add Promise.resolve)
3. Add export to package.json exports field
4. Add to main index.ts
5. Run `bun build` and `bun type-check:ci`
6. Create changeset if successful

## Files Modified
- ✅ `/packages/wallets/package.json` - added dependencies
- ✅ `/packages/wallets/src/near-wallet-selector/index.ts` - created implementation
- ⏳ Need to modify: `packages/helpers/src/types/config.ts` (or wherever SKConfigIntegrations is)
- ⏳ Need to modify: `/packages/wallets/package.json` - add export entry
- ⏳ Need to modify: `/packages/wallets/src/index.ts` - add export

## Notes
- WalletOption.WALLET_SELECTOR already exists in helpers enum
- All NEAR wallet selector dependencies were already partially added (meteor)
- Error code `wallet_near_method_not_supported` already exists (code: 22003)
