import { Chain } from "@swapkit/helpers";

import { GaiaToolbox } from "./gaia";
import { KujiraToolbox } from "./kujira";
import { createThorchainToolbox } from "./thorchain";

export type CosmosToolboxType = {
  THOR: ReturnType<typeof createThorchainToolbox<Chain.THORChain>>;
  GAIA: ReturnType<typeof GaiaToolbox>;
  KUJI: ReturnType<typeof KujiraToolbox>;
  MAYA: ReturnType<typeof createThorchainToolbox<Chain.Maya>>;
};

export const getCosmosToolbox = <T extends keyof CosmosToolboxType>(
  chain: T,
): CosmosToolboxType[T] => {
  switch (chain) {
    case Chain.Kujira:
      return KujiraToolbox() as CosmosToolboxType[T];
    case Chain.Maya:
      return createThorchainToolbox(Chain.Maya) as CosmosToolboxType[T];
    case Chain.THORChain:
      return createThorchainToolbox(Chain.THORChain) as CosmosToolboxType[T];
    case Chain.Cosmos:
      return GaiaToolbox() as CosmosToolboxType[T];
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
};

export * from "./BaseCosmosToolbox";
export * from "./gaia";
export * from "./kujira";
export * from "./thorchain";
