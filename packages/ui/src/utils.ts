import { SwapKit, SwapKitError, type WalletOption } from "@swapkit/core";
import { type PluginName, type SKPlugins, loadPlugin } from "@swapkit/plugins";
import { loadWallet } from "@swapkit/wallets";

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
