import { SKConfig, SwapKit, SwapKitError, WalletOption } from "@swapkit/core";
import type { PluginName, SKPlugins } from "@swapkit/plugins";
import type { SKWallets, SKWalletsSupportedChains } from "@swapkit/wallets";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { match } from "ts-pattern";

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
  const pluginNames = plugins || ([] as unknown as PluginNames);
  type Plugins = Awaited<ReturnType<typeof loadPlugins<PluginNames>>>;
  const [client, setClient] = useState<ReturnType<typeof SwapKit<Plugins, any>> | undefined>(
    undefined,
  );

  const connect = useCallback(
    async ({
      walletOption,
      chains,
    }: { walletOption: WalletOption; chains: SKWalletsSupportedChains[WalletOption] }) => {
      const { client, connectMethod } = await getSkClient({ walletOption, pluginNames });

      // @ts-ignore TODO: fix
      await client[connectMethod as keyof typeof client](chains);
      // @ts-ignore TODO: fix
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

  // @ts-ignore TODO: fix
  return <SwapKitContext.Provider value={contextValue}>{children}</SwapKitContext.Provider>;
}

export function useSwapKit<P extends PluginName[]>() {
  const context = useContext(SwapKitContext);
  if (!context) {
    throw new Error("SwapKitProvider not found");
  }

  return context as SwapKitContextType<P>;
}

async function getSkClient<W extends WalletOption, P extends PluginName[]>({
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

async function loadPlugins<P extends PluginName[]>(pluginNames: P) {
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
    .with("chainflip", async () => (await import("@swapkit/plugins/chainflip")).ChainflipPlugin)
    .with("thorchain", async () => (await import("@swapkit/plugins/thorchain")).ThorchainPlugin)
    .with("kado", async () => (await import("@swapkit/plugins/kado")).KadoPlugin)
    .with("radix", async () => (await import("@swapkit/plugins/radix")).RadixPlugin)
    .with("evm", async () => (await import("@swapkit/plugins/evm")).EVMPlugin)
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
