import type { Chain, ChainId, StagenetChain } from "./_enums";

type ChainIdHexType<T> = T extends { chainIdHex: infer U } ? (U extends string ? U : undefined) : undefined;

export function createChain<
  const Name extends string,
  const Type extends "utxo" | "evm" | "cosmos" | "substrate" | "others",
  const Params extends {
    baseDecimal: number;
    blockTime: number;
    chain: Chain | StagenetChain;
    chainId: ChainId;
    explorerUrl: string;
    name: Name;
    nativeCurrency: string;
    networkDerivationPath: [number, number, number, number, number?];
    rpcUrls: string[];
    type: Type;
  } & ({ chainIdHex: string } | { chainIdHex?: never }),
>(params: Params): Params & { chainIdHex: ChainIdHexType<Params> } {
  return params as Params & { chainIdHex: ChainIdHexType<Params> };
}
