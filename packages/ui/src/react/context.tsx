import { SKConfig, type SwapKit, type WalletOption, warnOnce } from "@swapkit/core";
import { SwapKitError } from "@swapkit/helpers";
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
import { getSkClient } from "../utils";

type SwapKitContextType<P extends PluginName[] = []> = {
  connect: <W extends WalletOption>(params: {
    walletOption: W;
    chains: SKWalletsSupportedChains[W];
  }) => Promise<Awaited<ReturnType<typeof getSkClient<W, P>>>["client"]>;
  getClient: () => Awaited<ReturnType<typeof getSkClient<WalletOption, PluginName[]>>>["client"];
};

const SwapKitContext = createContext<SwapKitContextType>({
  connect: () => {
    throw new SwapKitError("helpers_not_found_provider", { provider: "SwapKitProvider" });
  },
  getClient: () => {
    throw new SwapKitError("helpers_not_found_provider", { provider: "SwapKitProvider" });
  },
});

export function SwapKitProvider<const PluginNames extends PluginName[]>({
  children,
  config,
  plugins,
}: PropsWithChildren<{ config?: Parameters<typeof SKConfig.set>[0]; plugins?: PluginNames }>) {
  const pluginNames = plugins || ([] as unknown as PluginNames);
  const [client, setClient] = useState<ReturnType<typeof SwapKit<any, any>> | undefined>(undefined);

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
    warnOnce({
      condition: !client,
      id: "client_not_found",
      warning: "Client not found. Please run connect first.",
    });

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
  const context = useContext<SwapKitContextType<P>>(SwapKitContext);
  if (!context) {
    throw new SwapKitError("helpers_not_found_provider", { provider: "SwapKitProvider" });
  }

  return context;
}
