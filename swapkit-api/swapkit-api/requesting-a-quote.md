# Requesting a Quote

{% hint style="danger" %}
This documentation is outdated and doesn't correspond to the current release of SwapKit. For the correct documentation please visit [https://docs.swapkit.dev/](https://docs.swapkit.dev/)
{% endhint %}

All that you need to send a transaction from any off your wallets is our `/quote` endpoint.

```
const getQuote = async (sellAsset, buyAsset, sellAmount, senderAddress, recipientAddress) => {
    const result = await axios.get('https://api.thorswap.net/aggregator/tokens/quote', {
        params: {
            sellAsset,
            buyAsset,
            sellAmount,
            senderAddress,
            recipientAddress,
        }
    });
    return result.data;
}

const sellAsset = 'BTC.BTC';
const buyAsset = 'ETH.ETH';
const sellAmount = 0.1;
const senderAddress = BTC_WALLET_ADDRESS;
const recipientAddress = ETH_WALLET_ADDRESS;

const quote = await getQuote(sellAsset, buyAsset, sellAmount, senderAddress, recipientAddress);
```

If a quote for this trade can be found, the response will be like the following:

````json
```json
{
    "quoteId": "d21491be-62f3-4f6e-822c-a1e7ef265e46",
    "routes": [
        {
            "path": "ETH.USDT-EC7 -> BTC.BTC",
            "providers": [
                "THORCHAIN"
            ],
            "subProviders": [
                "THORCHAIN"
            ],
            "swaps": {
                "THORCHAIN": [
                    [
                        {
                            "from": "ETH.USDT-EC7",
                            "fromTokenAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7",
                            "to": "BTC.BTC",
                            "parts": [
                                {
                                    "provider": "THORCHAIN",
                                    "percentage": 100
                                }
                            ]
                        }
                    ]
                ]
            },
            "expectedOutput": "1.40311129",
            "expectedOutputMaxSlippage": "1.36224397087378640777",
            "expectedOutputUSD": "49380.2350249788",
            "expectedOutputMaxSlippageUSD": "47941.97575240661",
            "streamingSwap": {
                "estimatedTime": 1638,
                "fees": {
                    "THOR": [
                        {
                            "type": "inbound",
                            "asset": "ETH.ETH",
                            "networkFee": 0.00134232,
                            "networkFeeUSD": 2.5430118168,
                            "affiliateFee": 0,
                            "affiliateFeeUSD": 0,
                            "totalFee": 0.00134232,
                            "totalFeeUSD": 2.5430118168,
                            "isOutOfPocket": true
                        },
                        {
                            "type": "outbound",
                            "asset": "BTC.BTC",
                            "networkFee": 0.00105,
                            "networkFeeUSD": 36.7049522596346,
                            "affiliateFee": 75,
                            "affiliateFeeUSD": 75,
                            "isOutOfPocket": false,
                            "slipFee": 0.00071519,
                            "slipFeeUSD": 25.169956609439435,
                            "totalFee": 75.00176519,
                            "totalFeeUSD": 136.87490886907403
                        }
                    ]
                },
                "expectedOutput": "1.42568843",
                "expectedOutputMaxSlippage": "1.38416352427184466019",
                "expectedOutputUSD": "50174.8009922955152560567",
                "expectedOutputMaxSlippageUSD": "48713.3990216461313164129790747158511",
                "transaction": {
                    "from": "0xB6F1F501BA37551964C9b23B4c38faED71DDEAfA",
                    "to": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
                    "value": "0x00",
                    "data": "0x44bc937b0000000000000000000000006be503f700cdb68506eba69b087a71656bc944f6000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000ba43b740000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006549848f000000000000000000000000000000000000000000000000000000000000003a3d3a623a6263317132346766376c663838647a6c65763063726137396c787368736b34303778716a3376306e70723a302f332f31373a743a3135000000000000",
                    "gas": 44744,
                    "gasPrice": 30000000000
                }
            },
            "transaction": {
                "from": "0xB6F1F501BA37551964C9b23B4c38faED71DDEAfA",
                "to": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
                "value": "0x00",
                "data": "0x44bc937b0000000000000000000000006be503f700cdb68506eba69b087a71656bc944f6000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000ba43b740000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006549848f000000000000000000000000000000000000000000000000000000000000003d3d3a623a6263317132346766376c663838647a6c65763063726137396c787368736b34303778716a3376306e70723a3133363232343339373a743a3135000000",
                "gas": 44744,
                "gasPrice": 30000000000
            },
            "optimal": true,
            "complete": true,
            "fees": {
                "THOR": [
                    {
                        "type": "inbound",
                        "asset": "ETH.ETH",
                        "networkFee": 0.00134232,
                        "networkFeeUSD": 2.5430118168,
                        "affiliateFee": 0,
                        "affiliateFeeUSD": 0,
                        "totalFee": 0.00134232,
                        "totalFeeUSD": 2.5430118168,
                        "isOutOfPocket": true
                    },
                    {
                        "type": "outbound",
                        "asset": "BTC.BTC",
                        "networkFee": 0.00105,
                        "networkFeeUSD": 36.7049522596346,
                        "affiliateFee": 75,
                        "affiliateFeeUSD": 75,
                        "isOutOfPocket": false,
                        "slipFee": 0.00071519,
                        "slipFeeUSD": 25.169956609439435,
                        "totalFee": 75.00176519,
                        "totalFeeUSD": 136.87490886907403
                    }
                ]
            },
            "meta": {
                "hasStreamingSwap": true,
                "sellChain": "ETH",
                "sellChainGasRate": "70",
                "buyChain": "BTC",
                "buyChainGasRate": "105",
                "priceProtectionRequired": true,
                "priceProtectionDetected": true,
                "quoteMode": "TC-TC",
                "thornodeMeta": {
                    "expectedAmountOut": {
                        "assetAmount": "1.40311129",
                        "baseAmount": "140311129",
                        "decimal": 8,
                        "asset": {
                            "chain": "BTC",
                            "symbol": "BTC",
                            "ticker": "BTC",
                            "type": "Native",
                            "network": "Bitcoin",
                            "name": "BTC",
                            "decimal": 8,
                            "isSynth": false
                        },
                        "amount": {
                            "assetAmount": "1.40311129",
                            "baseAmount": "140311129",
                            "decimal": 8
                        }
                    },
                    "expectedAmountOutStreaming": {
                        "assetAmount": "1.42568843",
                        "baseAmount": "142568843",
                        "decimal": 8,
                        "asset": {
                            "chain": "BTC",
                            "symbol": "BTC",
                            "ticker": "BTC",
                            "type": "Native",
                            "network": "Bitcoin",
                            "name": "BTC",
                            "decimal": 8,
                            "isSynth": false
                        },
                        "amount": {
                            "assetAmount": "1.42568843",
                            "baseAmount": "142568843",
                            "decimal": 8
                        }
                    },
                    "expiry": 1699314178,
                    "fees": {
                        "affiliate": {
                            "assetAmount": "0.00214547",
                            "baseAmount": "214547",
                            "decimal": 8
                        },
                        "asset": {
                            "chain": "BTC",
                            "symbol": "BTC",
                            "ticker": "BTC",
                            "type": "Native",
                            "network": "Bitcoin",
                            "name": "BTC",
                            "decimal": 8,
                            "isSynth": false
                        },
                        "outbound": {
                            "assetAmount": "0.00105",
                            "baseAmount": "105000",
                            "decimal": 8
                        },
                        "liquidity": {
                            "assetAmount": "0.00071519",
                            "baseAmount": "71519",
                            "decimal": 8
                        },
                        "slippageBps": 5,
                        "total": {
                            "assetAmount": "0.00391066",
                            "baseAmount": "391066",
                            "decimal": 8
                        },
                        "totalBps": 27
                    },
                    "inboundAddress": "0x6be503f700cdb68506eba69b087a71656bc944f6",
                    "inboundConfirmationBlocks": 0,
                    "inboundConfirmationSeconds": 0,
                    "maxStreamingQuantity": 17,
                    "memo": "=:BTC.BTC:bc1q24gf7lf88dzlev0cra79lxshsk407xqj3v0npr:0/3/17:t:15",
                    "notes": "Base Asset: Send the inbound_address the asset with the memo encoded in hex in the data field. Tokens: First approve router to spend tokens from user: asset.approve(router, amount). Then call router.depositWithExpiry(inbound_address, asset, amount, memo, expiry). Asset is the token contract address. Amount should be in native asset decimals (eg 1e18 for most tokens). Do not send to or from contract addresses.",
                    "outboundDelayBlocks": 225,
                    "outboundDelaySeconds": 1350,
                    "recommendedMinAmountIn": "14682084000",
                    "router": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
                    "slippageBps": 84,
                    "streamingSlippageBps": 5,
                    "streamingSwapBlocks": 48,
                    "streamingSwapSeconds": 1350,
                    "totalSwapSeconds": 1350,
                    "warning": "Do not cache this response. Do not send funds after the expiry."
                },
                "warnings": []
            },
            "inboundAddress": "0x6be503f700cdb68506eba69b087a71656bc944f6",
            "targetAddress": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
            "estimatedTime": 1350,
            "calldata": {
                "depositWithExpiry": "0",
                "vault": "0x6be503f700cdb68506eba69b087a71656bc944f6",
                "asset": "ETH.USDT-0xdac17f958d2ee523a2206206994597c13d831ec7",
                "amount": "50000000000",
                "memo": "=:b:bc1q24gf7lf88dzlev0cra79lxshsk407xqj3v0npr:136224397:t:15",
                "memoStreamingSwap": "=:b:bc1q24gf7lf88dzlev0cra79lxshsk407xqj3v0npr:0/3/17:t:15",
                "expiration": "1699316879"
            },
            "contract": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
            "contractMethod": "depositWithExpiry",
            "approvalTarget": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
            "approvalToken": "0xdac17f958d2ee523a2206206994597c13d831ec7",
            "evmTransactionDetails": {
                "contractAddress": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
                "contractMethod": "depositWithExpiry",
                "contractParams": [
                    "0",
                    "0x6be503f700cdb68506eba69b087a71656bc944f6",
                    "ETH.USDT-0xdac17f958d2ee523a2206206994597c13d831ec7",
                    "50000000000",
                    "=:b:bc1q24gf7lf88dzlev0cra79lxshsk407xqj3v0npr:136224397:t:15",
                    "1699316879"
                ],
                "contractParamsStreaming": [
                    "0",
                    "0x6be503f700cdb68506eba69b087a71656bc944f6",
                    "ETH.USDT-0xdac17f958d2ee523a2206206994597c13d831ec7",
                    "50000000000",
                    "=:b:bc1q24gf7lf88dzlev0cra79lxshsk407xqj3v0npr:0/3/17:t:15",
                    "1699316879"
                ],
                "contractParamsNames": [
                    "depositWithExpiry",
                    "vault",
                    "asset",
                    "amount",
                    "memo",
                    "expiration"
                ],
                "approvalToken": "0xdac17f958d2ee523a2206206994597c13d831ec7",
                "approvalSpender": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146"
            },
            "index": 0
        }
    ],
    "sellAssetAmount": "50000"
}
```
````

### Possible Query Parameters

The `/quote` endpoints offer several parameters that can be used in order to customize the result.

| Parameter                     | Required | Description                                                                                                                                                                                                                                     | Example                                               |
| ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `sellAsset`                   | ✅        | The asset to be sold, including the chain of the token.                                                                                                                                                                                         | `ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044` |
| `buyAsset`                    | ✅        | The asset to purchase, including the chain of the token.                                                                                                                                                                                        | `BTC.BTC`                                             |
| `sellAmount`                  | ✅        | The `sellAsset` amount to sell.                                                                                                                                                                                                                 | `100`                                                 |
| `senderAddress`               | ✅        | The wallet address, of the `sellAsset` chain, that will sending the funds for the trade.                                                                                                                                                        | `0x123...`                                            |
| `recipientAddress`            | ✅        | The wallet address on the `buyAsset` chain. This is where the `buyAsset` tokens will be sent.                                                                                                                                                   | `bc1...`                                              |
| `slippage`                    | ❌        | Slippage tolerance as a percentage. If no value is provided, a default of 3 is used. E.g 3 is 3% max slippage.                                                                                                                                  | `3`                                                   |
| `limit`                       | ❌        | The maximum number of trade routes to return. The default is 5. E.g 5                                                                                                                                                                           | `5`                                                   |
| `providers`                   | ❌        | The possible liquidity sources.                                                                                                                                                                                                                 |                                                       |
| `preferredProvider`           | ❌        | Specify the provider that the swap should route through.                                                                                                                                                                                        | `ONEINCH`                                             |
| `affiliateAddress`            | ❌        | The affiliate thorname that will receive the affiliate fee. **Must be 4 chars or less.** Shorter the better.                                                                                                                                    | `partner1`                                            |
| `affiliateBasisPoints`        | ❌        | Basis points affiliate fee to take from the trade. E.g 50 is 0.5%                                                                                                                                                                               | `50`                                                  |
| `allowSmartContractRecipient` | ❌        | If set to true, we will not perform any safety checks on the `recipientAddress` on an EVM chain. This is risky, and funds will likely be lost. More info [here](https://docs.thorswap.net/aggregation-api/pathfinder#smart-contract-addresses). | `false`                                               |

### Starting from an EVM Chain

There are 3 options to build an EVM transaction from the response:\
a. `transaction`\
b. `evmTransactionDetails`\
c. `calldata` (deprecated)

#### a. transaction

````
```json
"transaction": {
                "from": "0xB6F1F501BA37551964C9b23B4c38faED71DDEAfA",
                "to": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
                "value": "0x00",
                "data": "0x44bc937b0000000000000000000000006be503f700cdb68506eba69b087a71656bc944f6000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000ba43b740000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006549848f000000000000000000000000000000000000000000000000000000000000003d3d3a623a6263317132346766376c663838647a6c65763063726137396c787368736b34303778716a3376306e70723a3133363232343339373a743a3135000000",
                "gas": 44744,
                "gasPrice": 30000000000
            }
```
````

#### b. evmTransactionDetails

````
```json
 "evmTransactionDetails": {
                "contractAddress": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
                "contractMethod": "depositWithExpiry",
                "contractParams": [
                    "0",
                    "0x6be503f700cdb68506eba69b087a71656bc944f6",
                    "ETH.USDT-0xdac17f958d2ee523a2206206994597c13d831ec7",
                    "50000000000",
                    "=:b:bc1q24gf7lf88dzlev0cra79lxshsk407xqj3v0npr:136224397:t:15",
                    "1699316879"
                ],
                "contractParamsStreaming": [
                    "0",
                    "0x6be503f700cdb68506eba69b087a71656bc944f6",
                    "ETH.USDT-0xdac17f958d2ee523a2206206994597c13d831ec7",
                    "50000000000",
                    "=:b:bc1q24gf7lf88dzlev0cra79lxshsk407xqj3v0npr:0/3/17:t:15",
                    "1699316879"
                ],
                "contractParamsNames": [
                    "depositWithExpiry",
                    "vault",
                    "asset",
                    "amount",
                    "memo",
                    "expiration"
                ],
                "approvalToken": "0xdac17f958d2ee523a2206206994597c13d831ec7",
                "approvalSpender": "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146"
            }
```
````

The `contractParams` property will contain an ordered array of smart contract input parameters. If streaming (`meta.hasStreamingSwap`) is available, then you should use `contractParamsStreaming`

`` `contractParamsNames` should not be used in production and could be removed. ``
