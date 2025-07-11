# @swapkit/wallet-tronlink

TronLink wallet integration for SwapKit.

## Installation

```bash
bun add @swapkit/wallet-tronlink
```

## Usage

```typescript
import { SwapKit } from '@swapkit/core';
import { tronlinkWallet } from '@swapkit/wallet-tronlink';

const swapKit = SwapKit({
  wallets: [tronlinkWallet],
  config: {
    tronApiKey: 'your-tron-api-key' // Optional
  }
});

// Connect to TronLink
await swapKit.connectWallet(WalletOption.TRONLINK, [Chain.Tron]);
```

## Requirements

- TronLink browser extension installed
- Browser environment (not compatible with Node.js)

## Features

- Connect to TronLink wallet
- Sign transactions
- Send TRX and TRC20 tokens
- Listen for account and network changes
- Full integration with SwapKit ecosystem

## Development

```bash
# Install dependencies
bun install

# Build the package
bun build

# Run type checking
bun type-check

# Lint code
bun lint
```

## License

MIT