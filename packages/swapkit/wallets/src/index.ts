import { bitgetWallet } from "@swapkit/wallet-bitget";
import { coinbaseWallet } from "@swapkit/wallet-coinbase";
import { ctrlWallet } from "@swapkit/wallet-ctrl";
import { evmWallet } from "@swapkit/wallet-evm-extensions";
import { keepkeyWallet } from "@swapkit/wallet-keepkey";
import { keepkeyBexWallet } from "@swapkit/wallet-keepkey-bex";
import { keplrWallet } from "@swapkit/wallet-keplr";
import { keystoreWallet } from "@swapkit/wallet-keystore";
import { ledgerWallet } from "@swapkit/wallet-ledger";
import { okxWallet } from "@swapkit/wallet-okx";
import { phantomWallet } from "@swapkit/wallet-phantom";
import { polkadotWallet } from "@swapkit/wallet-polkadotjs";
import { radixWallet } from "@swapkit/wallet-radix";
import { talismanWallet } from "@swapkit/wallet-talisman";
import { trezorWallet } from "@swapkit/wallet-trezor";
import { walletconnectWallet } from "@swapkit/wallet-wc";

export const wallets = {
  ...bitgetWallet,
  ...coinbaseWallet,
  ...evmWallet,
  ...keepkeyBexWallet,
  ...keepkeyWallet,
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
  ...ctrlWallet,
};
