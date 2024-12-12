import * as microgardEndpoints from "./microgard/endpoints";
import { mayachainMidgard, thorchainMidgard } from "./midgard/endpoints";
import * as swapkitApiEndpoints from "./swapkitApi/endpoints";
import * as thornodeEndpoints from "./thornode/endpoints";
import * as thorswapStaticEndpoints from "./thorswapStatic/endpoints";

export * from "./microgard/types";
export * from "./thorswapStatic/types";
export * from "./thornode/types";
export * from "./swapkitApi/types";

export { microgardEndpoints };
export { swapkitApiEndpoints };
export { thornodeEndpoints };
export { thorswapStaticEndpoints };
export { mayachainMidgard, thorchainMidgard };

export const SwapKitApi = {
  ...microgardEndpoints,
  ...thornodeEndpoints,
  ...swapkitApiEndpoints,
  ...thorswapStaticEndpoints,
  thorchainMidgard,
  mayachainMidgard,
};
