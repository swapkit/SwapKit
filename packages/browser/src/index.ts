import { SwapKit } from "@swapkit/core";
import { ChainflipPlugin } from "@swapkit/plugins/chainflip";
import { EVMPlugin } from "@swapkit/plugins/evm";
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
import { okxWallet } from "@swapkit/wallets/okx";
import { onekeyWallet } from "@swapkit/wallets/onekey";
import { phantomWallet } from "@swapkit/wallets/phantom";
import { polkadotWallet } from "@swapkit/wallets/polkadotjs";
import { radixWallet } from "@swapkit/wallets/radix";
import { talismanWallet } from "@swapkit/wallets/talisman";
import { trezorWallet } from "@swapkit/wallets/trezor";
import { vultisigWallet } from "@swapkit/wallets/vultisig";
import { walletconnectWallet } from "@swapkit/wallets/walletconnect";
import { xamanWallet } from "@swapkit/wallets/xaman";

const defaultPlugins = {
  ...ChainflipPlugin,
  ...EVMPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
  ...SolanaPlugin,
  ...NearPlugin,
};

const defaultWallets = {
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
  ...vultisigWallet,
  ...walletconnectWallet,
  ...xamanWallet,
};

export function createSwapKit(config: Parameters<typeof SwapKit>[0] = {}) {
  return SwapKit({ ...config, wallets: defaultWallets, plugins: defaultPlugins });
}

export * from "@swapkit/core";
export * from "@swapkit/helpers";
export * from "@swapkit/helpers/api";
export * from "@swapkit/wallets";
