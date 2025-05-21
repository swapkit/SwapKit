export * from "./toolbox";
export * from "./types";

import type { getCardanoToolbox } from "./toolbox";

export type CardanoWallet = Awaited<ReturnType<typeof getCardanoToolbox>>;
