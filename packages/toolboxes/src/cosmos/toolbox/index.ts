import { Chain, type CosmosChain, SwapKitError } from "@swapkit/helpers";

import type { CosmosToolboxParams } from "../types";
import { createCosmosToolbox } from "./cosmos";
import { createThorchainToolbox } from "./thorchain";

export type CosmosToolboxes = {
  GAIA: ReturnType<typeof createCosmosToolbox>;
  KUJI: ReturnType<typeof createCosmosToolbox>;
  MAYA: ReturnType<typeof createThorchainToolbox>;
  NOBLE: ReturnType<typeof createCosmosToolbox>;
  THOR: ReturnType<typeof createThorchainToolbox>;
};

export const getCosmosToolbox = <T extends Exclude<CosmosChain, Chain.Harbor>>(
  chain: T,
  params?: Omit<CosmosToolboxParams, "chain">,
): CosmosToolboxes[T] => {
  switch (chain) {
    case Chain.Cosmos:
    case Chain.Kujira:
    case Chain.Noble:
      return createCosmosToolbox({ chain, ...params }) as CosmosToolboxes[T];

    case Chain.Maya:
    case Chain.THORChain:
      return createThorchainToolbox({ chain, ...params }) as CosmosToolboxes[T];

    default:
      throw new SwapKitError("toolbox_cosmos_not_supported", { chain });
  }
};

export * from "./cosmos";
export * from "./thorchain";
