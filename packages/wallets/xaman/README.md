# @swapkit/wallet-xaman

Xaman wallet integration for SwapKit - enables XRPL transactions through the Xaman mobile wallet.

## Installation

```bash
npm install @swapkit/wallet-xaman
# or
yarn add @swapkit/wallet-xaman
# or
bun add @swapkit/wallet-xaman
```

## Usage

### Basic Setup

```typescript
import { SwapKit } from '@swapkit/core';
import { xamanWallet } from '@swapkit/wallet-xaman';

const swapKit = SwapKit({
  wallets: { ...xamanWallet },
  config: {
    xamanApiKey: 'your-xaman-api-key',
    xamanApiSecret: 'your-xaman-api-secret'
  }
});

// Connect Xaman wallet
await swapKit.connectWallet('xaman', [Chain.Ripple]);
```

### Alternative Configuration

```typescript
// Pass credentials directly to connect function
await swapKit.connectWallet('xaman', [Chain.Ripple], {
  apiKey: 'your-xaman-api-key',
  apiSecret: 'your-xaman-api-secret'
});
```

### Using with SwapKit SDK

```typescript
import { createSwapKit } from '@swapkit/sdk';

const swapKit = createSwapKit({
  config: {
    xamanApiKey: 'your-xaman-api-key',
    xamanApiSecret: 'your-xaman-api-secret'
  }
});

await swapKit.connectWallet('xaman', [Chain.Ripple]);
```

## Features

- XRP Ledger transaction support
- Memo and destination tag handling
- QR code generation for mobile signing
- Real-time transaction monitoring
- Integration with SwapKit's unified interface

## Requirements

- Xaman API credentials (get them from [Xaman Developer Console](https://apps.xumm.dev/))
- Mobile device with Xaman app installed
- XRPL network access

## API Reference

### Types

```typescript
interface XamanConfig {
  apiKey: string;
  apiSecret: string;
}

interface XamanPaymentParams {
  destination: string;
  amount: string;
  memo?: string;
  destinationTag?: number;
}

interface XamanPaymentResult {
  payloadId: string;
  qrCode: string;
  deepLink: string;
  websocketUrl: string;
}
```

### Methods

```typescript
// Initialize Xaman with API credentials
initializeXaman(config: XamanConfig): void

// Connect to Xaman wallet
connectXamanWallet(): Promise<string>

// Get connected wallet address
getXamanAddress(): string | null

// Create a payment transaction
sendXamanTransaction(params: XamanPaymentParams): Promise<XamanPaymentResult>

// Wait for transaction result
waitForXamanTransactionResult(payloadId: string): Promise<XamanTransactionResult>

// Disconnect wallet
disconnectXaman(): Promise<void>

// Check connection status
isXamanConnected(): boolean
```

## Error Handling

The wallet uses SwapKit's standardized error handling:

- `wallet_xaman_not_configured` - API credentials not provided
- `wallet_xaman_not_connected` - Wallet not connected
- `wallet_xaman_auth_failed` - Authentication failed
- `wallet_xaman_connection_failed` - Connection failed
- `wallet_xaman_transaction_failed` - Transaction creation failed
- `wallet_xaman_monitoring_failed` - Transaction monitoring failed

## Supported Chains

Currently supports:
- XRP Ledger (Ripple)

## License

Apache-2.0