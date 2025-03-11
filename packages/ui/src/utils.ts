import { SwapKit, SwapKitError, WalletOption } from "@swapkit/core";
import type { PluginName, SKPlugins } from "@swapkit/plugins";
import type { SKWallets } from "@swapkit/wallets";
import { match } from "ts-pattern";

export async function getSkClient<W extends WalletOption, P extends PluginName[]>({
  walletOption,
  pluginNames,
}: { walletOption: W; pluginNames: P }) {
  const connectedPlugins = await loadPlugins(pluginNames);
  const walletPkg = await loadWallet(walletOption);
  const connectMethod = Object.keys(walletPkg).find((key) => key.startsWith("connect"));
  if (!connectMethod) {
    throw new SwapKitError("core_wallet_connection_not_found", { walletOption });
  }

  return {
    client: SwapKit({ plugins: connectedPlugins, wallets: { ...walletPkg } }),
    connectMethod,
  };
}

export async function loadPlugins<P extends PluginName[]>(pluginNames: P) {
  let connectedPlugins = {} as Pick<SKPlugins, P[number]>;

  if (pluginNames?.length) {
    for (const pluginName of pluginNames) {
      const plugin = await loadPlugin(pluginName);
      connectedPlugins = { ...connectedPlugins, ...plugin };
    }
  }

  return connectedPlugins;
}

async function loadPlugin<P extends PluginName>(pluginName: P) {
  const plugin = await match(pluginName as PluginName)
    .with("chainflip", async () => {
      const { ChainflipPlugin } = await import("@swapkit/plugins/chainflip");
      return ChainflipPlugin;
    })
    .with("thorchain", async () => {
      const { ThorchainPlugin } = await import("@swapkit/plugins/thorchain");
      return ThorchainPlugin;
    })
    .with("kado", async () => {
      const { KadoPlugin } = await import("@swapkit/plugins/kado");
      return KadoPlugin;
    })
    .with("radix", async () => {
      const { RadixPlugin } = await import("@swapkit/plugins/radix");
      return RadixPlugin;
    })
    .with("evm", async () => {
      const { EVMPlugin } = await import("@swapkit/plugins/evm");
      return EVMPlugin;
    })
    .exhaustive();

  return plugin as unknown as SKPlugins[P];
}

async function loadWallet<W extends WalletOption>(walletOption: W): Promise<SKWallets[W]> {
  const wallet = await match(walletOption as WalletOption)
    .with(
      WalletOption.COINBASE_MOBILE,
      async () => (await import("@swapkit/wallets/coinbase")).coinbaseWallet,
    )
    .with(WalletOption.BITGET, async () => (await import("@swapkit/wallets/bitget")).bitgetWallet)
    .with(WalletOption.CTRL, async () => (await import("@swapkit/wallets/ctrl")).ctrlWallet)
    .with(WalletOption.OKX, async () => (await import("@swapkit/wallets/okx")).okxWallet)
    .with(WalletOption.ONEKEY, async () => (await import("@swapkit/wallets/onekey")).onekeyWallet)
    .with(WalletOption.EXODUS, async () => (await import("@swapkit/wallets/exodus")).exodusWallet)
    .with(
      WalletOption.KEEPKEY,
      async () => (await import("@swapkit/wallets/keepkey")).keepkeyWallet,
    )
    .with(
      WalletOption.KEEPKEY_BEX,
      async () => (await import("@swapkit/wallets/keepkey-bex")).keepkeyBexWallet,
    )
    .with(
      WalletOption.WALLETCONNECT,
      async () => (await import("@swapkit/wallets/walletconnect")).walletconnectWallet,
    )
    .with(
      WalletOption.KEPLR,
      WalletOption.LEAP,
      async () => (await import("@swapkit/wallets/keplr")).keplrWallet,
    )
    .with(
      WalletOption.BRAVE,
      WalletOption.COINBASE_WEB,
      WalletOption.EIP6963,
      WalletOption.METAMASK,
      WalletOption.OKX_MOBILE,
      WalletOption.TRUSTWALLET_WEB,
      async () => (await import("@swapkit/wallets/evm-extensions")).evmWallet,
    )

    .with(
      WalletOption.KEYSTORE,
      async () => (await import("@swapkit/wallets/keystore")).keystoreWallet,
    )
    .with(WalletOption.TREZOR, async () => (await import("@swapkit/wallets/trezor")).trezorWallet)
    .with(
      WalletOption.LEDGER,
      // TODO: Remove
      WalletOption.LEDGER_LIVE,
      async () => (await import("@swapkit/wallets/ledger")).ledgerWallet,
    )

    .with(
      WalletOption.PHANTOM,
      async () => (await import("@swapkit/wallets/phantom")).phantomWallet,
    )
    .with(
      WalletOption.POLKADOT_JS,
      async () => (await import("@swapkit/wallets/polkadotjs")).polkadotWallet,
    )
    .with(
      WalletOption.RADIX_WALLET,
      async () => (await import("@swapkit/wallets/radix")).radixWallet,
    )
    .with(
      WalletOption.TALISMAN,
      async () => (await import("@swapkit/wallets/talisman")).talismanWallet,
    )
    .exhaustive();

  return wallet as SKWallets[W];
}
