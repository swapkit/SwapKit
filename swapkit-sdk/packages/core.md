---
description: >-
  SwapKit Client that wraps wallets and method in clear and easy to use
  interface.
---

# @swapkit/core

{% hint style="info" %}
#### Includes [swapkit-api.md](swapkit-api.md "mention") _&_ [swapkit-helpers.md](swapkit-helpers.md "mention")
{% endhint %}

## **Getting started**

### **Installation**

```bash
<pnpm|bun> add @swapkit/core
```

### Usage

```typescript
import { Chain, SwapKit, SwapKitApi } from "@swapkit/core"
import { ledgerWallet } from "@swapkit/wallet-ledger"
import { keystoreWallet } from "@swapkit/wallet-keystore"
import { xdefiWallet } from "@swapkit/wallet-xdefi"
import { ThorchainPlugin } from "@swapkit/thorchain"

const client = SwapKit({
  wallets: { ...ledgerWallet, ...keystoreWallet, ...xdefiWallet },
  plugins: { ...ThorchainPlugin }
})

const swap = async () => {
    await client.connectXDEFI([Chain.Bitcoin, Chain.Ethereum])
// await client.connectKeystore([Chain.Bitcoin, Chain.Ethereum], "phrases ...")
// await client.connectLedger([Chain.Bitcoin])
    const { routes } = SwapKitApi.getSwapQuote({
        sellAsset: "ETH.ETH"
        sellAmount: 1,
        buyAsset: "BTC.BTC",
        senderAddress: client.getAddress(Chain.Ethereum),
        recipientAddress: client.getAddress(Chain.Bitcoin),
        slippage: "3",
    })

   const txHash = await client.swap({ pluginName: "thorchain",  ...routes[0] })
    
   const txExplorerUrl = client.getExplorerUrl({ chain: Chain.Ethereum, txHash })
}
```

## Methods

### **getAddress(chain:** [Chain](swapkit-helpers.md#chain)**): string**

_Returns address of previously connected chains with \`connectX\` method from wallet, if not connected returns empty string_

{% code fullWidth="false" %}
```typescript
const ethAddress = swapKitClient.getAddress(Chain.Ethereum)

if (ethAddress) {
  const addressExplorerUrl = swapKitClient.getExplorerAddressUrl({   
    chain: Chain.Ethereum, address: ethAddress 
  })
}
```
{% endcode %}

***

### **getBalance(chain:** [Chain](swapkit-helpers.md#chain), refresh?: boolea&#x6E;**): Promise<**[**AssetValue**](swapkit-helpers.md#assetvalue)**\[]>**

_Returns current chain wallet balance. Can fetch newest available balance when provided with \`refresh\` param_

{% code fullWidth="false" %}
```typescript
const currentBalance = await swapKitClient.getBalance(Chain.Ethereum)

const newestBalance = await swapKitClient.getBalance(Chain.Ethereum, true)
```
{% endcode %}

***

### getExplorerAddressUr&#x6C;**(params:** { address: string; chain: [Chain](swapkit-helpers.md#chain) }**): string**

_Returns url for address explorer. Useful for tracking connected addresses_

{% code fullWidth="false" %}
```typescript
const ethAddress = swapKitClient.getAddress(Chain.Ethereum)

const etherscanUrl = swapKitClient.getExplorerAddressUrl({
  address: ethAddress,
  chain: Chain.Ethereum,
})
```
{% endcode %}

***

### **getExplorerTxUrl(params:** { txHash: string; chain: [Chain](swapkit-helpers.md#chain) }**): string**

_Returns url for transaction explorer. Useful for tracking executed transactions_

{% code fullWidth="false" %}
```typescript
const ethTxHash = await swapKitClient.swap({ 
  pluginName: "thorchain",
  sellAsset: "ETH.USDC-...",
  ...
})

const txHashExplorerUrl = swapKitClient.getExplorerTxUrl({
  txHash: ethTxHash,
  chain: Chain.Ethereum,
})
```
{% endcode %}

***

### getWalle&#x74;**(chain:** [Chain](swapkit-helpers.md#chain)**):** ChainWallet

_Returns connected wallet chain info_

{% code fullWidth="false" %}
```typescript
await swapKitClient.connectXDEFI([Chain.Ethereum])

const ethWallet = swapKitClient.getWallet(Chain.Ethereum)

const {
  chain: Chain;
  address: string;
  balance: AssetValue[];
  walletType: WalletOption;
} = ethWallet
```
{% endcode %}

***

### getWalletWithBalanc&#x65;**(chain:** [Chain](swapkit-helpers.md#chain)**):** Promise\<ChainWallet>

_Fetches newest wallet balances, updated connected wallet with it and returns chain wallet. Useful for loading initial balance for connected chains._

{% code fullWidth="false" %}
```typescript
await swapKitClient.connectXDEFI([Chain.Ethereum])

const ethWallet = await swapKitClient.getWalletWithBalance(Chain.Ethereum)

const {
  chain: Chain;
  address: string;
  balance: AssetValue[];
  walletType: WalletOption;
} = ethWallet
```
{% endcode %}

***

### swa&#x70;**(params:** { pluginName: PluginName, ...paramsForPluginSwap }**): Promise\<string>**

_Returns transaction hash after successful execution. Params depeds on connected/used plugin._ \
_Check_ [_thorchain_](swapkit-thorchain.md#swap-chain-chain-string) _or_ [_chainflip_](swapkit-chainflip.md#swap-chain-chain-string) _swap params_

{% code fullWidth="false" %}
```typescript
const ethTxHash = await swapKitClient.swap({ 
  pluginName: "thorchain",
  ...
})
```
{% endcode %}

***

### validateAddres&#x73;**(params:** { address: string; chain: [Chain](swapkit-helpers.md#chain) }**): boolean**

_Validates given address for chain._

{% hint style="warning" %}
This function works only for connected chains
{% endhint %}

{% code fullWidth="false" %}
```typescript
const address = "0x..."
const isValid = swapKitClient.validateAddress({
  chain: Chain.Ethereum
  address,
})

if (isValid) {
  const tXHash = swapKitClient.swap({
    recipient: address
    ...
  })
}
```
{% endcode %}

***



