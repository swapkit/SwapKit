import { tronlinkWallet } from "./tronlinkWallet.js";
import type { TronLinkEvents, TronLinkResponse, TronLinkWindow } from "./types.js";

declare global {
  interface Window {
    tronLink?: TronLinkWindow;
    tronWeb?: TronLinkWindow["tronWeb"];
  }
}

export { tronlinkWallet };
export type { TronLinkWindow, TronLinkResponse, TronLinkEvents };
