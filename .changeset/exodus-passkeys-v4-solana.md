---
"@swapkit/wallets": minor
---

Update Exodus wallet integration to Passkeys v4 and add Solana support

- Updated @passkeys/core from v3 to v4 and @passkeys/react from v2 to v3
- Migrated internal implementation from synchronous `wallet.providers` to asynchronous `wallet.getProvider()` API
- Added Solana blockchain support to Exodus wallet integration
- Improved error handling for provider access
- Enhanced disconnect functionality using new `wallet.disconnect()` method when available

Note: This is not a breaking change for SwapKit users - the wallet connection API remains unchanged.