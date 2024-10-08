import { Chain } from "@swapkit/helpers";

export const SupportedKadoChain = {
  thorchain: Chain.THORChain,
  solana: Chain.Solana,
  polygon: Chain.Polygon,
  Optimism: Chain.Optimism,
  litecoin: Chain.Litecoin,
  kujira: Chain.Kujira,
  ethereum: Chain.Ethereum,
  "cosmos hub": Chain.Cosmos,
  bitocin: Chain.Bitcoin,
  base: Chain.Base,
  Avalanche: Chain.Avalanche,
  Arbitrum: Chain.Arbitrum,
};

export const ChainToKadoChain = (chain: Chain) => {
  const entries = Object.entries(SupportedKadoChain);
  const found = entries.find(([_, value]) => value === chain);
  if (!found) throw new Error(`Chain ${chain} not supported`);
  return found[0];
};

export const KadoChainToChain = (kadoChain: string) => {
  return Object.keys(SupportedKadoChain).includes(kadoChain)
    ? SupportedKadoChain[kadoChain as keyof typeof SupportedKadoChain]
    : undefined;
};
