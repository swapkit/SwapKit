---
description: Unlock cross-chain swaps in your application
---

# Advanced - Integrating SwapKit API

{% hint style="danger" %}
This documentation is outdated and doesn't correspond to the current release of SwapKit. For the correct documentation please visit [https://docs.swapkit.dev/](https://docs.swapkit.dev/)
{% endhint %}

If you want to integrate the API directly, this guide is for you!

In this guide we will walk you through:

1. Fetching a quote
2. Setting a token allowance (EVM only)
3. Performing a swap

## Prerequisites

### API Keys

You will first need to get a free API key. Please see the [partnerships](../partnership.md) page to get in touch.

Those credentials should be added to each request to our services by adding the following to your request headers:

```json
{
  "Referer": "project-name",
  "x-api-key": "aaa-bbb-ccc"
}
```

The production API key works for all `api.thorswap.net` endpoints, while the development API key works for `dev-api.thorswap.net` endpoints. Both environements point at mainnet and real assets, with the dev environement getting new feature requests shipped early for testing.

### Technical requirements

The code examples in this guide are written in `Typescript`

To follow along with this guide, you also need to have:

* npm
* node
* private keys for a wallet with some funds

### 1. Fetching a quote

The SwapKit API `/quote` endpoint will return an array of quotes for a given trade, ordered by the best return amount.

{% hint style="info" %}
For more info about the endpoint look at
{% endhint %}

Let's create a function `fetchBestQuote` that will retrieve a quote from the API and pick the best route available.

```
const fetchBestQuote = async ({
  amount,
  fromAsset,
  toAsset,
  senderAddress,
  recipientAddress,
  provider,
}) => {
  try {
    const THORSWAP_QUOTE_BASE_URL =
      'https://api.thorswap.net/aggregator/tokens/quote'
    const thorswapApiUrl = new URL(THORSWAP_QUOTE_BASE_URL)
    thorswapApiUrl.searchParams.append('sellAsset', fromAsset)
    thorswapApiUrl.searchParams.append('buyAsset', toAsset)
    thorswapApiUrl.searchParams.append('sellAmount', amount)
    thorswapApiUrl.searchParams.append('senderAddress', senderAddress)
    thorswapApiUrl.searchParams.append('recipientAddress', recipientAddress)
    thorswapApiUrl.searchParams.append('providers', provider)
    thorswapApiUrl.searchParams.append('providers', 'THORCHAIN')
    const response = await fetch(thorswapApiUrl.toString())
    const data = await response.json()

    const bestRoute = data.routes[0]
    return bestRoute
  } catch (error) {
    console.error(error)
  }
}
```

This will return a quote like we have seen in [Requesting a Quote](swapkit-api/requesting-a-quote.md). A summary of the trade will be returned, and a transaction object, only if there provided wallet addresses are able to execute the trade.

The quote response contains a lot of information, and we suggest checking out the \[API reference], in order to see the full response and get the most out of your integration.

### 1a. Inspecting the Transaction

Within the `/quote` response there is a `transaction` property that can be used in order to make our swap.

The SwapKit API returns a `transaction` object valid from the blockchain of the `sellAsset`. For example, if the `sellAsset` is `BTC.BTC` the `transaction` property will be a hexadecimal string of a [Partially Signed Bitcoin Transaction (PSBT)](https://en.bitcoin.it/wiki/BIP_0174).

The following table shows what the transaction object is for all of the blockchains supported by SwapKit API:

| Sell Asset                      | Buy Asset | Scenario       | What is Transaction?                                                                                                                                                                                      |
| ------------------------------- | --------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ETH.CRV                         | BTC.BTC   | Swap In        | A valid Ethereum transaction object.                                                                                                                                                                      |
| BTC.BTC / LTC.LTC / DOGE.DOGE   | ETH.CRV   | Swap Out       | A hexadecimal string of a [PSBT](https://en.bitcoin.it/wiki/BIP_0174).                                                                                                                                    |
| GAIA.ATOM / THOR.RUNE / BNB.BNB | ETH.CRV   | Swap Out       | A Cosmos TxBody                                                                                                                                                                                           |
| BCH.BCH                         | BTC.BTC   | THORChain only | An object of `inputs`and `output` used to create a [Transaction Builder](https://github.com/Bitcoin-com/bitcoincashjs-lib/blob/28447b40a4ccd23913f7ade6589dc7214c99e60a/src/transaction_builder.js#L476). |

The transaction objects different depending on the Sell Asset. It's possible to sign & send each transaction object using the core-libraries of each blockchain ecosystem:

* Avalanche / Ethereum / Binance Smart Chain - The EVM based chains use [ethers.js](https://docs.ethers.org/v5/) or [web3js](https://web3js.readthedocs.io/en/v1.2.11/getting-started.html).
* Bitcoin / Dogecoin / Litecoin - These UTXO chains use [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib).
* Bitcoin Cash - This uses [bitcoincashjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib).
* Cosmos / THORChain / Binance Beacon Chain - The Cosmos based chains rely on the [Cosmos Client](https://github.com/cosmos-client/cosmos-client-ts) library.

### 2. Set a Token Allowance (EVM only)

A token allowance is required in order to allow a third-party, in this case a smart contract, to move funds on your behalf. You _allow_ them to move your tokens.

{% hint style="info" %}
This step is only required if you are swapping **from** an EVM chain. For example, ETH.CRV -> ETH.UNI, and ETH.THOR -> BTC.BTC, etc.
{% endhint %}

In our case, we need to approve a smart contract to trade our ERC20/ARC20/BEP20 tokens for us. So we will need to _approve an allowance_ (a specified amount) for the smart contract to move the tokens on our behalf. The `/quote` response returns the contract that we have to approve in the `approvalTarget` property.

The process to do this in code is as follows:

* Connect with the ERC20/ARC20/BEP20 token's `approve()` method using [ethers.js](https://docs.ethers.org/v5/) or [web3js](https://web3js.readthedocs.io/en/v1.2.11/getting-started.html).
* Set the approval amount to `maxApproval` **or pass in a lower limit.**
* Use `approve()` to give our `approvalTarget` an allowance for specified amount.

### 2a. Connect with ARC20/BEP20/ERC20 Token's approve() method

All ARC20/BEP20/ERC20 tokens adhere to the same standard, and must implement the [approve(address spender, uint256 amount)](https://docs.openzeppelin.com/contracts/2.x/api/token/erc20#IERC20-approve-address-uint256-) function. As mentioned above, this function sets `amount` as the allowance of `spender` over the caller's tokens; i.e your user's tokens. It returns a boolean value indicating whether the operation was successful.

So let's do it:

```
import Web3 from 'web3';

const web3 = new Web3(Web3.givenProvider);
const erc20abi = [...];

const fromTokenAddress = bestRoute.calldata.token;

const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
```

Now let's set the approval amount:

```
// 
const maxApproval = new BigNumber(2).pow(256).minus(1);

const approveTxEncoded = await ERC20TokenContract.methods.approve(
    bestRoute.approvalTarget,
    maxApproval,
).encodeABI();

const approveTx = {
    to: fromTokenAddress,
    data: approveTxEncoded,
    gas: 300000,
    type: 0,
};

const signedApproveTx = await web3.eth.accounts.signTransaction(approveTx, ETH_PRIVATE_KEY);
const approveTxHash = await web3.eth.sendSignedTransaction(signedApproveTx.rawTransaction);
```

Great, we've approved our token for trading! Now let's perform the swap.

### 3. Execute the Swap

Now let's take a look at executing the swap, and making our trade. We'll look at a few different examples, one for each of the different type of [transaction objects](integrating-swapkit-api.md#1a.-inspecting-the-transaction) the SwapKit API will return.

First, let's finish off the example where the `sellAsset` is an EVM chain, and make a swap from `ETH.CRV -> BTC.BTC`

{% hint style="info" %}
All code examples for the swaps we will cover can be found in our [Github repo](https://github.com/thorswap/swap-examples).
{% endhint %}

### 3a. ETH.CRV -> BTC.BTC - EVM Transaction Object

As mentioned in ['Inspecting the Transaction'](integrating-swapkit-api.md#1a.-inspecting-the-transaction), the transaction object returned by the SwapKit API for this scenario is a valid Ethereum transaction. We will use the [web3js](https://web3js.readthedocs.io/en/v1.2.11/getting-started.html) library to sign and broadcast the transaction from our wallet.

The `transaction` for this quote will look like the following:

```
// Example transaction object
{
  "to": "0xd31f7e39afECEc4855fecc51b693F9A0Cec49fd2",
  "from": "0xA58818F1cA5A7DD524Eca1F89E2325e15BAD6cc4",
  "value": "0x0",
  "gas": "273217",
  "gasPrice": "18000000000",
  "nonce": "272",
  "data": "0x0701c374000000000000000000000000d37bbe5744d730a1d98d8dc97c42f0ca46ad7146000000000000000000000000ff772b437e0c20d46722d67fdb973d70fd46cece00000000000000000000000000000000000000000000000000000000000001000000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000001111111254fb6c44bac0bed2854e76f90643097d000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000",
}
```

{% hint style="info" %}
The transaction object includes suggested `gas` (the gas limit) & `gasPrice.`
{% endhint %}

Now we will use the [signTransaction](https://web3js.readthedocs.io/en/v1.2.11/web3-eth-accounts.html#signtransaction) and [sendSignedTransaction](https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#sendsignedtransaction) methods from the [web3js](https://web3js.readthedocs.io/en/v1.2.11/getting-started.html) library.

```
// doSwapIn.ts
import Web3 from 'web3'
import { Transaction } from '@ethereumjs/tx'
...

// Initialize web3 instance
const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_HTTP_URL))

// This buffer will be used to sign the transaction
const privateKeyBuffer = Buffer.from(ETH_PRIVATE_KEY, 'hex')

// Create Transaction object
const tx = new Transaction(transaction)

// Sign it
const signedTx = tx.sign(privateKeyBuffer)

// Serialize it
const serializedTx = signedTx.serialize()

// Send it & log the receipt
await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);

console.log('Swap complete!')
```

And that's all! We have successfully made a swap from ETH.CRV to native Bitcoin 🥳

### 3b. BTC.BTC -> ETH.CRV - PSBT Object

As mentioned in ['Inspecting the Transaction'](integrating-swapkit-api.md#1a.-inspecting-the-transaction), the transaction object returned by the SwapKit API for this scenario is a valid hexadecimal string of a [Partially Signed Bitcoin Transaction](https://en.bitcoin.it/wiki/BIP_0174) (PSBT). We will use the [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) library to rehydrate the object, sign, and broadcast the transaction from our Bitcoin wallet.

{% hint style="info" %}
All code examples for the swaps we will cover can be found in our [Github repo](https://github.com/thorswap/swap-examples).
{% endhint %}

First, let's rehydrate the PSBT:

```
// doSwapBtc.ts
import { Psbt } from 'bitcoinjs-lib'

// Fetch the quote and pick the transaction property
const bestRoute = await fetchBestQuote({
    amount,
    fromAsset,
    toAsset,
    senderAddress,
    recipientAddress,
    provider,
})

const bestRouteTransaction = bestRoute.transaction

// Use Psbt utils to rehydrate
const psbt = Psbt.fromHex(bestRouteTransaction)
```

Now we'll use the private keys of our Bitcoin wallet to sign the PSBT. There are many methods to do this. I will create my wallets private key using [ecpair](https://github.com/bitcoinjs/ecpair) and [tiny-secp256k](https://github.com/bitcoinjs/tiny-secp256k1) libraries.

```
// doSwapBtc.ts
import * as ECPair from 'ecpair'
import * as tinysecp256k1 from 'tiny-secp256k1';

...
const ec = ECPair.ECPairFactory(tinysecp256k1)
const ecpair = ec.fromWIF(BTC_PRIVATE_KEY, btcNetwork)
```

Great! Now we have the wallet's keypair in code, we can sign the inputs for the PSBT, and finalize it!

```
...

// Sign the inputs of the PSBT & finalize
const signedPsbt = psbt.signAllInputs(ecpair)

const finalizedPsbt = signedPsbt.finalizeAllInputs()
```

Then we must extract the transaction object from the PSBT, and broadcast our transaction to the network.

```
...
// Extract the transaction
const tx = finalizedPsbt.extractTransaction()

// Broadcast the hex of the transaction
const txHash = await broadcastTx({ txHex: tx.toHex(), chain: 'bitcoin' })
console.log('Transaction Broadcasted!')
console.log(`Transaction hash: ${txHash}`)
```

There are different public endpoints available to broadcast your transaction to, below is a snippet using [Blockchair's API](https://blockchair.com/api/docs)

```
const broadcastTx = async ({ txHex, chain }: { txHex: string; chain: string; }) => {
    try {
        const url = new URL(`https://api.blockchair.com/${chain}/push/transaction`)
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: txHex
            })
        })
        console.log('Response: ', response)
        const data = await response.json();
        if (data.context.code !== 200) throw new Error('Fail to broadcast')
        return data
    } catch (error) {
        console.error('Failed to broadcast transaction : ', error)
    }
}
```

Now we have successfully broadcasted a transaction to swap native BTC on the Bitcoin network, through THORChain, to CRV on Ethereum!

### 3c. GAIA.ATOM -> THOR.RUNE

As mentioned in 'Inspecting the Transaction', the transaction object returned by the THORSwap API for this scenario is a [Cosmos TxBody](https://docs.cosmos.network/master/core/proto-docs.html#cosmos.tx.v1beta1.TxBody). We will use the [Cosmos Client](https://github.com/cosmos-client/cosmos-client-ts) library to build the rest of the transaction, sign, and broadcast the transaction to the blockchain!

{% hint style="info" %}
All code examples for the swaps we will cover can be found in our [Github repo](https://github.com/thorswap/swap-examples).
{% endhint %}

First, let's initialize the CosmosSDK, then get the private keys for our Cosmos wallet, and fetch our address.

```
// doSwapAtom.ts
import { cosmosclient, proto, rest } from '@cosmos-client/core';

// Call fetchBestQuote above
const bestRoute = await fetchBestQuote({
  amount,
  fromAsset,
  toAsset,
  senderAddress,
  recipientAddress,
  provider,
})

// Pick the transaction body
const txBody = bestRoute.transaction

// Init SDK
const sdk = new cosmosclient.CosmosSDK(`https://cosmos-mainnet-rpc.allthatnode.com:1317`, 'cosmoshub-4')

// Get private key from mnemonic phrase
const privKey = new proto.cosmos.crypto.secp256k1.PrivKey({
    key: await cosmosclient.generatePrivKeyFromMnemonic(MNEMONIC)
})
const pubKey = privKey.pubKey()

// Get the wallet address
const address = cosmosclient.AccAddress.fromPublicKey(pubKey)

// Fetch account details
const account = await rest.auth
    .account(sdk, address)
    .then((res) => cosmosclient.codec.protoJSONToInstance(cosmosclient.codec.castProtoJSONOfProtoAny(res.data.account)))
    .catch((_) => undefined);

if (!(account instanceof proto.cosmos.auth.v1beta1.BaseAccount)) {
    console.log('Something went wrong');
    return;
}
```

Now we can create the AuthInfo object which is required to complete the TxBuilder.

```
...
// Create AuthInfo details required in TxBuilder
const authInfo = new proto.cosmos.tx.v1beta1.AuthInfo({
    signer_infos: [
        {
            public_key: cosmosclient.codec.instanceToProtoAny(pubKey),
            mode_info: {
                single: {
                    mode: proto.cosmos.tx.signing.v1beta1.SignMode.SIGN_MODE_DIRECT,
                },
            },
            sequence: account.sequence,
        },
    ],
    fee: new proto.cosmos.tx.v1beta1.Fee({
        amount: [{ denom: 'uatom', amount: '5000' }],
        gas_limit: Long.fromString('200000'),
    }),
});

// Create the TxBuilder object.
const txBuilder = new cosmosclient.TxBuilder(sdk, txBody, authInfo)
```

Great! We have built the transaction builder object. Now we can sign the builder using the private key we derived previously, and broadcast the transaction to the RPC we configured when instantiating the SDK.

```
...

// Sign the transaction using private key
const signDocBytes = txBuilder.signDocBytes(account.account_number)
txBuilder.addSignature(privKey.sign(signDocBytes))


// Broadcast the transaction to RPC
const res = await rest.tx.broadcastTx(sdk, {
  tx_bytes: txBuilder.txBytes(),
  mode: rest.tx.BroadcastTxMode.Block,
})

console.log(`Transaction broadcasted!`)
console.log(`Transaction hash: ${res.data.tx_response.txhash}`)
```

Whoop! Now we have successfully broadcasted a transaction from the Cosmos blockchain, swapping our ATOM, through THORChain, to RUNE.

### 3d. BCH.BCH -> BTC.BTC

As mentioned in ['Inspecting the Transaction'](integrating-swapkit-api.md#1a.-inspecting-the-transaction), the 'transaction' object returned when BitcoinCash is the sell asset differs to other UTXO assets. The API returns an object of inputs and outputs in the transaction prop. These are used to create a [Transaction Builder](https://github.com/Bitcoin-com/bitcoincashjs-lib/blob/28447b40a4ccd23913f7ade6589dc7214c99e60a/src/transaction_builder.js#L476) of the [bitcoincashjs-lib](https://github.com/Bitcoin-com/bitcoincashjs-lib).

{% hint style="info" %}
All code examples for the swaps we will cover can be found in our [Github repo](https://github.com/thorswap/swap-examples).
{% endhint %}

As before, we will fetch a quote from the API, specifying our desired trade. In this example, we will be swapping 10 BCH -> BTC.

```
// doSwapBch.ts

// Fetch JSON response from /quote endpoint
const bestRoute = await fetchBestQuote({
  amount: 10,
  fromAsset: 'BCH.BCH',
  toAsset: 'BTC.BTC',
  senderAddress: '<my BCH address>',
  recipientAddress: '<my BTC address>',
  provider: 'THORCHAIN'
})
```

Now let's pick the inputs & outputs from the 'transaction' property. Then, using bitcoincashjs-lib & coininfo libraries, we will create an instance of the TransactionBuilder.

```
import * as bitcoincash from "bitcoincashjs-lib"
import coininfo from "coininfo"

...
const { inputs, outputs } = bestRoute.transaction

// Get the BCH Network details
const bchNetwork = coininfo.bitcoincash.main.toBitcoinJS()

const builder = new bitcoincash.TransactionBuilder(bchNetwork)
```

With the builder, now we can add the inputs & outputs, returned from the API, into the builder. Bitcoincash has 2 different address types, so in order to support both possibilities, we will be using the 'bchaddrjs' library to convert BCH addresses to the legacy format.

```
...
import { toLegacyAddress } from 'bchaddrjs';

...
// Add inputs to builder
inputs.forEach((input) =>
  builder.addInput(
    bitcoincash.Transaction.fromBuffer(Buffer.from(input.txHex, "hex")),
    input.index
  )
);

// Add outputs to builder
outputs.forEach((output) => {
  let out = undefined;
  if (!output.address) {
    //an empty address means this is the  change address
    out = bitcoincash.address.toOutputScript(
      toLegacyAddress(senderAddress),
      bchNetwork
    );
  } else if (output.address) {
    out = bitcoincash.address.toOutputScript(
      toLegacyAddress(output.address),
      bchNetwork
    );
  }
  builder.addOutput(out, output.value);
});
```

Now let's get the private keys for our Bitcoincash wallet, and sign the inputs of our builder, before broadcasting this transaction to the Blockchair API.

```
import * as ECPair from "ecpair";
import * as tinysecp256k1 from "tiny-secp256k1";

...

// Recreate wallet keys
const ec = ECPair.ECPairFactory(tinysecp256k1);
const ecpair = ec.fromWIF(BCH_PRIVATE_KEY, bchNetwork);

// Sign inputs
inputs.forEach((utxo, index) => {
  builder.sign(index, ecpair, undefined, 0x41, utxo.witnessUtxo.value);
});

// Build TransactionBuilder
const tx = builder.build().toHex();

// // Broadcast the hex of the transaction
const txHash = await broadcastTx({ txHex: tx, chain: "bitcoin-cash" });
console.log("Transaction Broadcasted!");
console.log(`Transaction hash: ${txHash}`);
```

There are different public endpoints available to broadcast your transaction to, below is a snippet using [Blockchair's API](https://blockchair.com/api/docs)

```
const broadcastTx = async ({ txHex, chain }: { txHex: string; chain: string; }) => {
    try {
        const url = new URL(`https://api.blockchair.com/${chain}/push/transaction`)
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: txHex
            })
        })
        console.log('Response: ', response)
        const data = await response.json();
        if (data.context.code !== 200) throw new Error('Fail to broadcast')
        return data
    } catch (error) {
        console.error('Failed to broadcast transaction : ', error)
    }
}
```

Great! Now we have swapped from native BCH on the Bitcoin Cash network, to native BTC on the Bitcoin network; in a totally decentralised way, using THORChain.
