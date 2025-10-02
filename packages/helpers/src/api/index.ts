import { mayachainMidgard, thorchainMidgard } from "./midgard/endpoints";
import * as swapkit from "./swapkitApi/endpoints";
import * as thornode from "./thornode/endpoints";

export * from "./midgard/types";
export * from "./swapkitApi/types";
export * from "./thornode/types";

export const SwapKitApi = { ...swapkit, mayachainMidgard, thorchainMidgard, thornode };
