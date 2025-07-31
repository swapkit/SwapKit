export {
  createTronToolbox,
  getTronAddressValidator,
  getTronPrivateKeyFromMnemonic,
} from "./toolbox";
export type {
  TronSigner,
  TronToolboxOptions,
  TronTransferParams,
  TronContract,
  TronTransaction,
  TronSignedTransaction,
  TronCreateTransactionParams,
  TronApproveParams,
  TronApprovedParams,
  TronIsApprovedParams,
} from "./types";
export { trc20ABI } from "./helpers/trc20.abi";

import type { createTronToolbox } from "./toolbox";
export type TronWallet = Awaited<ReturnType<typeof createTronToolbox>>;
