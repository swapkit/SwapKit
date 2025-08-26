type ChainIdHexType<T> = T extends { chainIdHex: infer U } ? (U extends string ? U : undefined) : undefined;

export function createChain<
  const Name extends string,
  const Chain extends string,
  const Type extends "utxo" | "evm" | "cosmos" | "substrate" | "others",
  const ChainId extends string,
  const Params extends {
    baseDecimal: number;
    blockExplorerUrl: string;
    chain: Chain;
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

type ExtractChains<T extends readonly any[]> = T extends readonly [...infer Items]
  ? { [K in keyof Items]: Items[K] extends { chain: infer C } ? C : never }
  : never;

export function mapChains<T extends readonly any[]>(chains: T) {
  return chains.map((chain) => createChain(chain)) as ExtractChains<T>;
}
