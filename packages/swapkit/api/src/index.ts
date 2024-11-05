import * as microgardEndpoints from "./microgard/endpoints";
import { mayachainMidgard, thorchainMidgard } from "./midgard/endpoints";
import * as swapkitApiEndpoints from "./swapkitApi/endpoints";
import * as thornodeEndpoints from "./thornode/endpoints";
import * as thorswapApiEndpoints from "./thorswapApi/endpoints";
import * as thorswapStaticEndpoints from "./thorswapStatic/endpoints";

export * from "./thorswapApi/types";
export * from "./microgard/types";
export * from "./thorswapStatic/types";
export * from "./thornode/types";
export * from "./swapkitApi/types";

export const SwapKitApi = {
  ...microgardEndpoints,
  ...thornodeEndpoints,
  ...thorswapApiEndpoints,
  ...swapkitApiEndpoints,
  ...thorswapStaticEndpoints,
  thorchainMidgard,
  mayachainMidgard,
};
