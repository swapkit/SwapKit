import type { Chain, ChainId } from "./_enums";

type ChainIdHexType<T> = T extends { chainIdHex: infer U } ? (U extends string ? U : undefined) : undefined;

export function createChain<
  const Name extends string,
  const Type extends "utxo" | "evm" | "cosmos" | "substrate" | "others",
  const Params extends {
    baseDecimal: number;
    blockExplorerUrl: string;
    blockTime: number;
    chain: Chain;
    chainId: ChainId;
    networkDerivationPath: [number, number, number, number, number?];
    explorerUrl: string;
    name: Name;
    nativeCurrency: string;
    rpcUrls: string[];
    type: Type;
  } & ({ chainIdHex: string } | { chainIdHex?: never }),
>(params: Params): Params & { chainIdHex: ChainIdHexType<Params> } {
  return params as Params & { chainIdHex: ChainIdHexType<Params> };
}
