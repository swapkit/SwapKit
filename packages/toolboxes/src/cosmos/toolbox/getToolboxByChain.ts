import { Chain } from "@swapkit/helpers";

import { GaiaToolbox, KujiraToolbox } from "./BaseCosmosToolbox";
import { MayaToolbox, ThorchainToolbox } from "./thorchain";

export type CosmosToolboxType = {
  THOR: typeof ThorchainToolbox;
  GAIA: typeof GaiaToolbox;
  KUJI: typeof KujiraToolbox;
  MAYA: typeof MayaToolbox;
};

export const getToolboxByChain = <T extends keyof CosmosToolboxType>(
  chain: T,
): CosmosToolboxType[T] => {
  switch (chain) {
    case Chain.Cosmos:
      return GaiaToolbox as CosmosToolboxType[T];
    case Chain.Kujira:
      return KujiraToolbox as CosmosToolboxType[T];
    case Chain.Maya:
      return MayaToolbox as CosmosToolboxType[T];
    case Chain.THORChain:
      return ThorchainToolbox as CosmosToolboxType[T];
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
};
