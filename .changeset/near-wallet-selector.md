---
"@swapkit/helpers": minor
"@swapkit/wallets": minor
"@swapkit/sdk": minor
---

Add NEAR Wallet Selector integration

- Added `walletSelector` wallet adapter supporting 5 NEAR wallet modules (MyNearWallet, Meteor, Sender, HERE Wallet, Nightly)
- Added `nearWalletSelector` configuration to SKConfig integrations for optional contractId
- Integrated wallet selector into SDK's default wallets
- Modal auto-shows on connection for wallet selection
- Supports mainnet only (hardcoded)
