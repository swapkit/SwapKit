export * from "./toolbox";
export * from "./types";
export * from "./helpers";

import type { getNearToolbox } from "./toolbox";

export type NearWallet = Awaited<ReturnType<typeof getNearToolbox>>;

export type {
  NearContractInterface,
  NearCallParams,
  NearGasEstimateParams,
} from "./types/contract";
export type {
  FungibleTokenMetadata,
  StorageBalance,
  StorageBalanceBounds,
  NEP141Contract,
  TokenTransferParams,
} from "./types/nep141";

export { createNEP141Token } from "./helpers/nep141";
export { estimateGas, tgasToGas, gasToTGas } from "./helpers/gasEstimation";
export { createNearContract } from "./helpers/contractFactory";
