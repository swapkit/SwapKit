---
description: After installing the SDK, you first need to set it up.
---

# 2️⃣ 2️⃣ Set up the SDK

{% hint style="danger" %}
This documentation is outdated and doesn't correspond to the current release of SwapKit. For the correct documentation please visit [https://docs.swapkit.dev/](https://docs.swapkit.dev/)
{% endhint %}

To get started, you have to instantiate and configure the SwapKit SDK:

```typescript
import { createSwapKit } from '@swapkit/sdk'

const swapKitClient = createSwapKit({
  config: {
    stagenet?: boolean;
    /**
     * @required for AVAX & BSC
     */
    covalentApiKey?: string;
    /**
     * @required for ETH
     */
    ethplorerApiKey?: string;
    /**
     * @required for BTC, LTC, DOGE & BCH
     */
    utxoApiKey?: string;
    /**
     * @required for Walletconnect
     */
    walletConnectProjectId?: string;
    /**
     * @optional for Trezor config
     */
    trezorManifest?: {
        email: string;
        appUrl: string;
    };
  };
})
```

### Connecting a wallet

SwapKit supports several wallet options, including: Keystore, Trezor, Ledger, WalletConnect, and Browser wallets. These options are described in the enum `WalletOption`

Below is a example `connectWallet` that can be used to connect any wallet in the frontend of your dApp:

```typescript
import { AssetAmount, Chain, createSwapKit, WalletOption } from '@swapkit/sdk'

const client = createSwapKit();
const connectChains = [Chain.Ethereum, Chain.Bitcoin, Chain.THORChain]

const connectWallet = (walletOption: WalletOption) => {
  switch (walletOption) {
    case WalletOption.KEYSTORE: {
      return client.connectKeystore(connectChains, phrase);
    }

    case WalletOption.XDEFI:
      return client.connectXDEFI(connectChains);

    case WalletOption.WALLETCONNECT:
      return client.connectWalletconnect(connectChains);

    case WalletOption.METAMASK:
      return client.connectEVMWallet(connectChains, WalletOption.METAMASK);

    case WalletOption.WALLETCONNECT:
      return client.connectWalletconnect(connectChains);

    default:
      break;
  }
}, []);
  
const fetchWalletBalances = () => {
  const wallets = await Promise.all(connectChains.map(client.getWalletByChain));

  console.log(wallets)
  // [{ balance: AssetAmount[]; address: string; walletType: WalletOption }]
}
```

