import { SKConfig, type SwapKit, type WalletOption } from "@swapkit/core";
import type { PluginName } from "@swapkit/plugins";
import type { SKWalletsSupportedChains } from "@swapkit/wallets";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSkClient, type loadPlugins } from "../utils";

type SwapKitContextType<P extends PluginName[] = []> = {
  connect: <W extends WalletOption>(params: {
    walletOption: W;
    chains: SKWalletsSupportedChains[W];
  }) => Promise<Awaited<ReturnType<typeof getSkClient<W, P>>>["client"]>;
  getClient: () => Awaited<ReturnType<typeof getSkClient<WalletOption, PluginName[]>>>["client"];
};

const SwapKitContext = createContext<SwapKitContextType>({
  connect: () => {
    throw new Error("SwapKitProvider not found");
  },
  getClient: () => {
    throw new Error("SwapKitProvider not found");
  },
});

export function SwapKitProvider<const PluginNames extends PluginName[]>({
  children,
  config,
  plugins,
}: PropsWithChildren<{ config?: Parameters<typeof SKConfig.set>[0]; plugins?: PluginNames }>) {
  type Plugins = Awaited<ReturnType<typeof loadPlugins<PluginNames>>>;
  const pluginNames = plugins || ([] as unknown as PluginNames);
  const [client, setClient] = useState<ReturnType<typeof SwapKit<Plugins, any>> | undefined>(
    undefined,
  );

  const connect = useCallback(
    async ({
      walletOption,
      chains,
    }: { walletOption: WalletOption; chains: SKWalletsSupportedChains[WalletOption] }) => {
      const { client, connectMethod } = await getSkClient({ walletOption, pluginNames });

      // @ts-ignore
      await client[connectMethod as keyof typeof client](chains);
      // @ts-ignore
      setClient(client);
      return client;
    },
    [pluginNames],
  );

  const getClient = useCallback(() => {
    if (!client) {
      console.error("Client not found. Please run connect first.");
    }

    return client;
  }, [client]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: skip
  useEffect(() => {
    if (config) {
      SKConfig.set(config);
    }
  }, []);

  const contextValue = useMemo(() => ({ getClient, connect }), [connect, getClient]);

  // @ts-ignore
  return <SwapKitContext.Provider value={contextValue}>{children}</SwapKitContext.Provider>;
}

export function useSwapKit<P extends PluginName[]>() {
  const context = useContext(SwapKitContext);
  if (!context) {
    throw new Error("SwapKitProvider not found");
  }

  return context as SwapKitContextType<P>;
}
