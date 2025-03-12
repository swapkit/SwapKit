import { SwapKit } from "@swapkit/core";
import { ChainflipPlugin } from "@swapkit/plugins/chainflip";
import { EVMPlugin } from "@swapkit/plugins/evm";
import { KadoPlugin } from "@swapkit/plugins/kado";
import { RadixPlugin } from "@swapkit/plugins/radix";
import { MayachainPlugin, ThorchainPlugin } from "@swapkit/plugins/thorchain";

import { bitgetWallet } from "@swapkit/wallets/bitget";
import { coinbaseWallet } from "@swapkit/wallets/coinbase";
import { ctrlWallet } from "@swapkit/wallets/ctrl";
import { evmWallet } from "@swapkit/wallets/evm-extensions";
import { exodusWallet } from "@swapkit/wallets/exodus";
import { keepkeyWallet } from "@swapkit/wallets/keepkey";
import { keepkeyBexWallet } from "@swapkit/wallets/keepkey-bex";
import { keplrWallet } from "@swapkit/wallets/keplr";
import { keystoreWallet } from "@swapkit/wallets/keystore";
import { ledgerWallet } from "@swapkit/wallets/ledger";
import { okxWallet } from "@swapkit/wallets/okx";
import { onekeyWallet } from "@swapkit/wallets/onekey";
import { phantomWallet } from "@swapkit/wallets/phantom";
import { polkadotWallet } from "@swapkit/wallets/polkadotjs";
import { radixWallet } from "@swapkit/wallets/radix";
import { talismanWallet } from "@swapkit/wallets/talisman";
import { trezorWallet } from "@swapkit/wallets/trezor";
import { walletconnectWallet } from "@swapkit/wallets/walletconnect";

export * from "@swapkit/core";

export const defaultPlugins = {
  ...ChainflipPlugin,
  ...EVMPlugin,
  ...KadoPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
};

export const defaultWallets = {
  ...bitgetWallet,
  ...coinbaseWallet,
  ...ctrlWallet,
  ...evmWallet,
  ...exodusWallet,
  ...keepkeyBexWallet,
  ...keepkeyWallet,
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

export function createSwapKit(config: Parameters<typeof SwapKit>[0] = {}) {
  return SwapKit({
    ...config,
    wallets: defaultWallets,
    plugins: defaultPlugins,
  });
}
