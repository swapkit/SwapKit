---
"@swapkit/wallet-exodus": minor
---

feat: Migrate Exodus wallet to Passkeys v4 and add Solana support

- Updated `@passkeys/core` from v3.2.0 to v4.0.0
- Updated `@passkeys/react` from v2.3.3 to v3.0.0  
- Migrated from synchronous `wallet.providers` to async `wallet.getProvider(chain)` API
- Added Solana chain support to Exodus wallet integration
- Added `@swapkit/toolbox-solana` dependency
- Refactored provider access pattern - moved all provider retrieval logic into `getWalletMethods`
- Simplified disconnect to use `wallet.disconnect` directly
- Improved error handling for provider retrieval failures