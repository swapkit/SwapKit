import type { Eip1193Provider } from "@swapkit/toolboxes/evm";
import { bitgetWallet } from "./bitget";
import { coinbaseWallet } from "./coinbase";
import { ctrlWallet } from "./ctrl";
import { evmWallet } from "./evm-extensions";
import { exodusWallet } from "./exodus";
import { keepkeyWallet } from "./keepkey";
import { keepkeyBexWallet } from "./keepkey-bex";
import { keplrWallet } from "./keplr";
import { keystoreWallet } from "./keystore";
import { ledgerWallet } from "./ledger";
import { okxWallet } from "./okx";
import { phantomWallet } from "./phantom";
import { polkadotWallet } from "./polkadotjs";
import { radixWallet } from "./radix";
import { talismanWallet } from "./talisman";
import { trezorWallet } from "./trezor";
import { walletconnectWallet } from "./walletconnect";

export const wallets = {
  ...bitgetWallet,
  ...coinbaseWallet,
  ...ctrlWallet,
  ...evmWallet,
  ...exodusWallet,
  ...keepkeyWallet,
  ...keepkeyBexWallet,
  ...keplrWallet,
  ...keystoreWallet,
  ...ledgerWallet,
  ...okxWallet,
  ...phantomWallet,
  ...polkadotWallet,
  ...radixWallet,
  ...talismanWallet,
  ...trezorWallet,
  ...walletconnectWallet,
};

declare global {
  interface Window {
    keepkey?: {
      binance: Eip1193Provider;
      bitcoin: Eip1193Provider;
      bitcoincash: Eip1193Provider;
      dogecoin: Eip1193Provider;
      ethereum: Eip1193Provider;
      cosmos: Eip1193Provider;
      dash: Eip1193Provider;
      litecoin: Eip1193Provider;
      thorchain: Eip1193Provider;
      mayachain: Eip1193Provider;
    };
  }
}
