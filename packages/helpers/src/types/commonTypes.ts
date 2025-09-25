import type { Chain } from "@swapkit/types";
import type { ChainWallet } from "./wallet";

export type AddChainType<M = { [key in string]: any }> = <T extends Chain>(
  params: Omit<ChainWallet<T>, "balance"> & M,
) => void;

export type Witness = { value: number; script: Buffer };

export type Asset = { chain: Chain; symbol: string; ticker: string; synth?: boolean };
