import { SwapKit } from "@swapkit/core";
import { ChainflipPlugin } from "@swapkit/plugins/chainflip";
import { EVMPlugin } from "@swapkit/plugins/evm";
import { KadoPlugin } from "@swapkit/plugins/kado";
import { RadixPlugin } from "@swapkit/plugins/radix";
import { SolanaPlugin } from "@swapkit/plugins/solana";
import { MayachainPlugin, ThorchainPlugin } from "@swapkit/plugins/thorchain";

import * as bitgetWallet from "@swapkit/wallets/bitget";
import * as coinbaseWallet from "@swapkit/wallets/coinbase";
import * as ctrlWallet from "@swapkit/wallets/ctrl";
import * as evmWallet from "@swapkit/wallets/evm-extensions";
import * as exodusWallet from "@swapkit/wallets/exodus";
import * as keepkeyWallet from "@swapkit/wallets/keepkey";
import * as keepkeyBexWallet from "@swapkit/wallets/keepkey-bex";
import * as keplrWallet from "@swapkit/wallets/keplr";
import * as keystoreWallet from "@swapkit/wallets/keystore";
import * as ledgerWallet from "@swapkit/wallets/ledger";
import * as okxWallet from "@swapkit/wallets/okx";
import * as onekeyWallet from "@swapkit/wallets/onekey";
import * as phantomWallet from "@swapkit/wallets/phantom";
import * as polkadotWallet from "@swapkit/wallets/polkadotjs";
import * as radixWallet from "@swapkit/wallets/radix";
import * as talismanWallet from "@swapkit/wallets/talisman";
import * as trezorWallet from "@swapkit/wallets/trezor";
import * as walletconnectWallet from "@swapkit/wallets/walletconnect";

export * from "@swapkit/core";

export * from "@swapkit/toolboxes/cosmos";
export * from "@swapkit/toolboxes/evm";
export * from "@swapkit/toolboxes/radix";
export * from "@swapkit/toolboxes/solana";
export * from "@swapkit/toolboxes/substrate";
export * from "@swapkit/toolboxes/utxo";

export * from "@swapkit/plugins/chainflip";
export * from "@swapkit/plugins/evm";
export * from "@swapkit/plugins/kado";
export * from "@swapkit/plugins/radix";
export * from "@swapkit/plugins/thorchain";
export * from "@swapkit/plugins/solana";

export {
  bitgetWallet,
  coinbaseWallet,
  ctrlWallet,
  evmWallet,
  exodusWallet,
  keepkeyWallet,
  keepkeyBexWallet,
  keplrWallet,
  keystoreWallet,
  ledgerWallet,
  okxWallet,
  onekeyWallet,
  phantomWallet,
  polkadotWallet,
  radixWallet,
  talismanWallet,
  trezorWallet,
  walletconnectWallet,
};

export const defaultPlugins = {
  ...ChainflipPlugin,
  ...EVMPlugin,
  ...KadoPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
  ...SolanaPlugin,
};

export const defaultWallets = {
  ...bitgetWallet.bitgetWallet,
  ...coinbaseWallet.coinbaseWallet,
  ...ctrlWallet.ctrlWallet,
  ...evmWallet.evmWallet,
  ...exodusWallet.exodusWallet,
  ...keepkeyBexWallet.keepkeyBexWallet,
  ...keepkeyWallet.keepkeyWallet,
  ...keplrWallet.keplrWallet,
  ...keystoreWallet.keystoreWallet,
  ...ledgerWallet.ledgerWallet,
  ...okxWallet.okxWallet,
  ...onekeyWallet.onekeyWallet,
  ...phantomWallet.phantomWallet,
  ...polkadotWallet.polkadotWallet,
  ...radixWallet.radixWallet,
  ...talismanWallet.talismanWallet,
  ...trezorWallet.trezorWallet,
  ...walletconnectWallet.walletconnectWallet,
};

export function createSwapKit(config: Parameters<typeof SwapKit>[0] = {}) {
  return SwapKit({
    ...config,
    wallets: defaultWallets,
    plugins: defaultPlugins,
  });
}
