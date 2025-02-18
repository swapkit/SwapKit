import * as microgard from "./microgard/endpoints";
import { mayachainMidgard, thorchainMidgard } from "./midgard/endpoints";
import * as swapkit from "./swapkitApi/endpoints";
import * as thornode from "./thornode/endpoints";
import * as tsStatic from "./thorswapStatic/endpoints";

export * from "./microgard/types";
export * from "./thorswapStatic/types";
export * from "./thornode/types";
export * from "./swapkitApi/types";

export const SwapKitApi = {
  ...swapkit,
  ...tsStatic,
  mayachainMidgard,
  microgard,
  thorchainMidgard,
  thornode,
};
