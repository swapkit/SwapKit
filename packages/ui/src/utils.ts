import {
  loadPlugin,
  loadWallet,
  type PluginName,
  type SKConfigState,
  type SKPlugins,
  SwapKit,
  SwapKitError,
  type WalletOption,
} from "@swapkit/sdk";

export async function getSkClient<W extends WalletOption, P extends PluginName[]>({
  walletOption,
  pluginNames,
}: {
  walletOption: W;
  pluginNames: P;
}): Promise<{ client: ReturnType<typeof SwapKit>; connectMethod: string }> {
  const connectedPlugins = await loadPlugins(pluginNames);
  const walletPkg = await loadWallet(walletOption);
  const connectMethod = Object.keys(walletPkg).find((key) => key.startsWith("connect"));
  if (!connectMethod) {
    throw new SwapKitError("core_wallet_connection_not_found", { walletOption });
  }

  return {
    client: SwapKit({ plugins: connectedPlugins, wallets: { ...walletPkg } }) as ReturnType<typeof SwapKit>,
    connectMethod,
  };
}

export async function loadPlugins<P extends PluginName[]>(pluginNames: P): Promise<Pick<SKPlugins, P[number]>> {
  let connectedPlugins = {} as Pick<SKPlugins, P[number]>;

  if (pluginNames?.length) {
    for (const pluginName of pluginNames) {
      const plugin = await loadPlugin(pluginName);
      connectedPlugins = { ...connectedPlugins, ...plugin };
    }
  }

  return connectedPlugins;
}

export const getStableConfigMemoKey = (config: SKConfigState | undefined) => {
  if (!config) return null;

  try {
    return JSON.stringify(config);
  } catch (error) {
    console.error("Failed to get stable config memo key:", error);
    return null;
  }
};
