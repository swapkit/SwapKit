---
"@swapkit/wallets": minor
"@swapkit/helpers": patch
---

Add NEAR Protocol support to multiple wallets

- Add NEAR support to Ledger hardware wallet using @ledgerhq/hw-app-near
- Add NEAR support to OKX browser extension wallet
- Add NEAR support to WalletConnect v2 protocol
- Add NEAR support to CTRL (formerly XDEFI) browser extension wallet
- Create shared NEAR signer utilities for consistent wallet integration
- Add NEAR chain IDs and configuration for mainnet/testnet
- Update window type definitions to include NEAR providers

Each wallet implementation includes:
- Address retrieval and management
- Transaction signing capabilities
- Integration with NEAR toolbox
- Proper error handling

Note: Message signing support varies by wallet due to hardware/protocol limitations.