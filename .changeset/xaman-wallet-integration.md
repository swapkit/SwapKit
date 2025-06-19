---
"@swapkit/helpers": patch
"@swapkit/wallets": minor
---

feat: Add Xaman (XUMM) wallet integration

- Added support for Xaman (formerly XUMM) mobile wallet for Ripple/XRP transactions
- Added XAMAN to WalletOption enum in @swapkit/helpers
- Added `xaman` to SKConfig apiKeys for centralized API key management
- Added wallet-specific error codes for better error handling
- Supports QR code and deep linking for mobile transaction signing
- Includes destination tag support for exchange addresses
- Uses official xumm SDK v1.8.0