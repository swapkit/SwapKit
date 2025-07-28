---
"@swapkit/helpers": patch
"@swapkit/wallets": patch
---

Add TronLink wallet integration

- Add TRONLINK to WalletOption enum
- Implement TronLink wallet connector with support for Tron chain
- Use hybrid provider detection with `tronlink#initialized` event
- Handle account and network change events
- Implement robust error handling for user rejection
- Add network verification during connection