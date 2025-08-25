import type { Chain } from "./chains";
import type { ChainWallet, CryptoChain } from "./wallet";

export type AddChainType<M = { [key in string]: any }> = <T extends CryptoChain>(
  params: Omit<ChainWallet<T>, "balance"> & M,
) => void;

export type Witness = { value: number; script: Buffer };

export type Asset = { chain: Chain; symbol: string; ticker: string; synth?: boolean };
