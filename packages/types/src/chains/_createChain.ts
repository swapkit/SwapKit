import type { Chain, ChainId, StagenetChain } from "./_enums";

type ChainIdHexType<T> = T extends { chainIdHex: infer U } ? (U extends string ? U : undefined) : undefined;

type ExtractChains<T extends readonly any[]> = T extends readonly [...infer Items]
  ? { [K in keyof Items]: Items[K] extends { chain: infer C } ? C : never }
  : never;

export function createChain<
  const Name extends string,
  const Type extends "utxo" | "evm" | "cosmos" | "substrate" | "others",
  const Params extends {
    baseDecimal: number;
    blockTime: number;
    blockExplorerUrl?: string;
    chain: Chain | StagenetChain;
    chainId: ChainId;
    explorerUrl: string;
    name: Name;
    nativeCurrency: string;
    rpcUrl: string;
    type: Type;
  } & ({ chainIdHex: string } | { chainIdHex?: never }),
>(params: Params): Params & { chainIdHex: ChainIdHexType<Params> } {
  return params as Params & { chainIdHex: ChainIdHexType<Params> };
}

export function mapChains<T extends readonly any[]>(chains: T) {
  return chains.map(({ chain }) => chain) as ExtractChains<T>;
}
