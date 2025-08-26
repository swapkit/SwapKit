import { createChain, mapChains } from "./_createChain";

const BTC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/bitcoin",
  chain: "BTC",
  chainId: "bitcoin",
  explorerUrl: "https://blockchair.com/bitcoin",
  name: "Bitcoin",
  nativeCurrency: "BTC",
  rpcUrl: "https://bitcoin-rpc.publicnode.com",
  type: "utxo",
});

const BCH = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://www.blockchair.com/bitcoin-cash",
  chain: "BCH",
  chainId: "bitcoincash",
  explorerUrl: "https://www.blockchair.com/bitcoin-cash",
  name: "BitcoinCash",
  nativeCurrency: "BCH",
  rpcUrl: "https://node-router.thorswap.net/bitcoin-cash",
  type: "utxo",
});

const LTC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/litecoin",
  chain: "LTC",
  chainId: "litecoin",
  explorerUrl: "https://blockchair.com/litecoin",
  name: "Litecoin",
  nativeCurrency: "LTC",
  rpcUrl: "https://node-router.thorswap.net/litecoin",
  type: "utxo",
});

const DOGE = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/dogecoin",
  chain: "DOGE",
  chainId: "dogecoin",
  explorerUrl: "https://blockchair.com/dogecoin",
  name: "Dogecoin",
  nativeCurrency: "DOGE",
  rpcUrl: "https://node-router.thorswap.net/dogecoin",
  type: "utxo",
});

const DASH = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/dash",
  chain: "DASH",
  chainId: "dash",
  explorerUrl: "https://blockchair.com/dash",
  name: "Dash",
  nativeCurrency: "DASH",
  rpcUrl: "https://dash-rpc.publicnode.com",
  type: "utxo",
});

const ZEC = createChain({
  baseDecimal: 8,
  blockExplorerUrl: "https://blockchair.com/zcash",
  chain: "ZEC",
  chainId: "zcash",
  explorerUrl: "https://blockchair.com/zcash",
  name: "Zcash",
  nativeCurrency: "ZEC",
  rpcUrl: "https://api.tatum.io/v3/blockchain/node/zcash-mainnet/t-6894a2ae7fc90cccfd3ce71b-2fce88aa7f4a41a5b1e93874",
  type: "utxo",
});

export const UTXOChainConfigs = [BTC, BCH, LTC, DOGE, DASH, ZEC] as const;
export const UTXOChains = mapChains(UTXOChainConfigs);
export type UTXOChain = (typeof UTXOChains)[number];
