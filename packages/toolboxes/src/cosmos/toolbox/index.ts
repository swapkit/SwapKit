import { Chain, type CosmosChain } from "@swapkit/helpers";

import type { CosmosToolboxParams } from "../types";
import { createCosmosToolbox } from "./cosmos";
import { createThorchainToolbox } from "./thorchain";

export type CosmosToolboxType = {
  GAIA: ReturnType<typeof createCosmosToolbox>;
  KUJI: ReturnType<typeof createCosmosToolbox>;
  MAYA: ReturnType<typeof createThorchainToolbox>;
  THOR: ReturnType<typeof createThorchainToolbox>;
};

export const getCosmosToolbox = <T extends CosmosChain>(
  chain: T,
  params?: Omit<CosmosToolboxParams, "chain">,
): CosmosToolboxType[T] => {
  switch (chain) {
    case Chain.Cosmos:
    case Chain.Kujira:
      return createCosmosToolbox({ chain, ...params }) as CosmosToolboxType[T];

    case Chain.Maya:
    case Chain.THORChain:
      return createThorchainToolbox({ chain, ...params }) as CosmosToolboxType[T];

    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
};

export * from "./cosmos";
export * from "./thorchain";
