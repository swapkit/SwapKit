// This should be cleared from unnecessary imports and migrate to:
// - `sdk/toolboxes`
// - `sdk/plugins`
// - `sdk/wallets`
import { SwapKit } from "@swapkit/core";
import { ChainflipPlugin } from "@swapkit/plugins/chainflip";
import { EVMPlugin } from "@swapkit/plugins/evm";
import { GardenPlugin } from "@swapkit/plugins/garden";
import { NearPlugin } from "@swapkit/plugins/near";
import { RadixPlugin } from "@swapkit/plugins/radix";
import { SolanaPlugin } from "@swapkit/plugins/solana";
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
import { walletSelectorWallet } from "@swapkit/wallets/near-wallet-selector";
import { okxWallet } from "@swapkit/wallets/okx";
import { onekeyWallet } from "@swapkit/wallets/onekey";
import { phantomWallet } from "@swapkit/wallets/phantom";
import { polkadotWallet } from "@swapkit/wallets/polkadotjs";
import { radixWallet } from "@swapkit/wallets/radix";
import { talismanWallet } from "@swapkit/wallets/talisman";
import { trezorWallet } from "@swapkit/wallets/trezor";
import { tronlinkWallet } from "@swapkit/wallets/tronlink";
import { vultisigWallet } from "@swapkit/wallets/vultisig";
import { walletconnectWallet } from "@swapkit/wallets/walletconnect";
import { xamanWallet } from "@swapkit/wallets/xaman";

export * from "@swapkit/core";
export * from "@swapkit/helpers";
export * from "@swapkit/helpers/api";
export * from "@swapkit/plugins";
export * from "@swapkit/plugins/chainflip";
export * from "@swapkit/plugins/evm";
export * from "@swapkit/plugins/near";
export * from "@swapkit/plugins/radix";
export * from "@swapkit/plugins/solana";
export * from "@swapkit/plugins/thorchain";
export * from "@swapkit/toolboxes";
export * from "@swapkit/toolboxes/cosmos";
export * from "@swapkit/toolboxes/evm";
export * from "@swapkit/toolboxes/radix";
export * from "@swapkit/toolboxes/solana";
export * from "@swapkit/toolboxes/substrate";
export * from "@swapkit/toolboxes/utxo";
export * from "@swapkit/wallets";

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
  tronlinkWallet,
  vultisigWallet,
  walletconnectWallet,
  walletSelectorWallet,
  xamanWallet,
};

export const defaultPlugins = {
  ...ChainflipPlugin,
  ...EVMPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
  ...SolanaPlugin,
  ...NearPlugin,
  ...GardenPlugin,
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
  ...tronlinkWallet,
  ...vultisigWallet,
  ...walletconnectWallet,
  ...walletSelectorWallet,
  ...xamanWallet,
};

export function createSwapKit(config: Parameters<typeof SwapKit>[0] = {}) {
  return SwapKit({ ...config, plugins: defaultPlugins, wallets: defaultWallets });
}
