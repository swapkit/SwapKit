# Xaman Wallet Integration

## Configuration

### Option 1: Configure via SKConfig (Recommended)

```typescript
import { SwapKit } from "@swapkit/core";
import { SKConfig } from "@swapkit/helpers";

// Set the Xaman API key globally
SKConfig.setApiKey("xaman", "your-xaman-api-key");

// Or configure during SwapKit initialization
const swapKit = SwapKit({
  config: {
    apiKeys: {
      xaman: "your-xaman-api-key"
    }
  }
});

// Connect to Xaman wallet
await swapKit.connectWallet(WalletOption.XAMAN, [Chain.Ripple]);
```

### Option 2: Pass API key during connection

```typescript
// Connect with API key override
await swapKit.connectWallet(WalletOption.XAMAN, [Chain.Ripple], {
  apiKey: "your-xaman-api-key"
});
```

## Usage Example

```typescript
// Get the connected wallet
const wallet = swapKit.getWallet(Chain.Ripple);

// Send XRP
const txHash = await wallet.transfer({
  assetValue: AssetValue.from({ chain: Chain.Ripple, value: 1 }),
  recipient: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  memo: "Payment memo"
});
```

## Destination Tags

For exchange addresses that require destination tags:

```typescript
// The destination tag should be included in the memo field
// Format: "DestinationTag:123456"
const txHash = await wallet.transfer({
  assetValue: AssetValue.from({ chain: Chain.Ripple, value: 10 }),
  recipient: "rExchangeAddress...",
  memo: "DestinationTag:123456"
});
```

## Getting an API Key

To use the Xaman wallet, you need to obtain an API key from the [Xaman Developer Console](https://apps.xumm.dev/).