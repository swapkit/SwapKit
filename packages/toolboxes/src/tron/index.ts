export { trc20ABI } from "./helpers/trc20.abi";
export {
  createTronToolbox,
  getTronAddressValidator,
  getTronPrivateKeyFromMnemonic,
} from "./toolbox";
export type {
  TronApprovedParams,
  TronApproveParams,
  TronContract,
  TronCreateTransactionParams,
  TronIsApprovedParams,
  TronSignedTransaction,
  TronSigner,
  TronToolboxOptions,
  TronTransaction,
  TronTransferParams,
} from "./types";

import type { createTronToolbox } from "./toolbox";
export type TronWallet = Awaited<ReturnType<typeof createTronToolbox>>;
