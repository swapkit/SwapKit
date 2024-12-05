import type { Keplr } from "@keplr-wallet/types";
import type { Eip1193Provider } from "@swapkit/toolbox-evm";
import type { SolanaProvider } from "@swapkit/toolbox-solana";

export { ctrlWallet, CTRL_SUPPORTED_CHAINS } from "./ctrlWallet";

type CtrlSolana = SolanaProvider & { isXDEFI: boolean };

declare global {
  interface Window {
    xfi?: {
      binance: Eip1193Provider;
      bitcoin: Eip1193Provider;
      bitcoincash: Eip1193Provider;
      dogecoin: Eip1193Provider;
      ethereum: Eip1193Provider;
      keplr: Keplr;
      litecoin: Eip1193Provider;
      thorchain: Eip1193Provider;
      mayachain: Eip1193Provider;
      solana: CtrlSolana;
    };
  }
}
