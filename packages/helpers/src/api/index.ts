import { mayachainMidgard, thorchainMidgard } from "./midgard/endpoints";
import * as swapkit from "./swapkitApi/endpoints";
import * as thornode from "./thornode/endpoints";
import * as tsStatic from "./thorswapStatic/endpoints";

export * from "./midgard/types";
export * from "./swapkitApi/types";
export * from "./thornode/types";
export * from "./thorswapStatic/types";

export const SwapKitApi = { ...swapkit, ...tsStatic, mayachainMidgard, thorchainMidgard, thornode };
