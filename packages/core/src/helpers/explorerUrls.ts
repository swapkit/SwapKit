import { Chain, ChainToExplorerUrl, SwapKitError } from "@swapkit/helpers";

export function getExplorerTxUrl({ chain, txHash }: { txHash: string; chain: Chain }) {
  const baseUrl = ChainToExplorerUrl[chain];

  switch (chain) {
    case Chain.Maya:
    case Chain.Kujira:
    case Chain.Cosmos:
    case Chain.THORChain:
    case Chain.Solana:
      return `${baseUrl}/tx/${txHash.startsWith("0x") ? txHash.slice(2) : txHash}`;

    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.BinanceSmartChain:
    case Chain.Base:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polkadot:
    case Chain.Polygon:
      return `${baseUrl}/tx/${txHash.startsWith("0x") ? txHash : `0x${txHash}`}`;

    case Chain.Litecoin:
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Radix:
      return `${baseUrl}/transaction/${txHash.toLowerCase()}`;

    default:
      throw new SwapKitError({ errorKey: "core_explorer_unsupported_chain", info: { chain } });
  }
}

export function getExplorerAddressUrl({ chain, address }: { address: string; chain: Chain }) {
  const baseUrl = ChainToExplorerUrl[chain];

  switch (chain) {
    case Chain.Solana:
    case Chain.Radix:
      return `${baseUrl}/account/${address}`;

    default:
      return `${baseUrl}/address/${address}`;
  }
}
