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
import { onekeyWallet } from "./onekey";
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
  ...onekeyWallet,
  ...phantomWallet,
  ...polkadotWallet,
  ...radixWallet,
  ...talismanWallet,
  ...trezorWallet,
  ...walletconnectWallet,
};
