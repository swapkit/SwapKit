export {
  connectXamanWallet,
  sendXamanTransaction,
  waitForXamanTransactionResult,
} from "./walletMethods.js";
export { xamanWallet } from "./xamanWallet.js";
export { XAMAN_SUPPORTED_CHAINS } from "./xamanWallet.js";
export type {
  XamanConfig,
  XamanConnectConfig,
  XamanPaymentParams,
  XamanPaymentResult,
  XamanTransactionResult,
  XamanWalletState,
} from "./types.js";
