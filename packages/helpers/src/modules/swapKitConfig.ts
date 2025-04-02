import { createStore } from "zustand/vanilla";
import { Chain, EXPLORER_URLS, NODE_URLS, RPC_URLS, WalletOption } from "../types";

export type SKConfigIntegrations = {
  chainflip?: { useSDKBroker?: boolean; brokerUrl: string };
  coinbase?: {
    appName: string;
    appLogoUrl?: string | null;
    darkMode?: boolean;
    linkAPIUrl?: string;
    overrideIsMetaMask?: boolean;
    overrideIsCoinbaseWallet?: boolean;
    overrideIsCoinbaseBrowser?: boolean;
    headlessMode?: boolean;
    reloadOnDisconnect?: boolean;
  };
  trezor?: { email: string; appUrl: string };
  keepKey?: { name: string; imageUrl: string; basePath: string; url: string };
  radix: {
    dAppDefinitionAddress: string;
    applicationName: string;
    applicationVersion: string;
    network: { networkId: number; networkName: string; dashboardBase: string };
  };
};

const initialState = {
  // TODO: figure out how to type apis without using toolbox directly
  // Maybe move rpc/toolbox apis to helpers?
  apis: {} as { [key in Chain]: any },
  chains: Object.values(Chain),
  wallets: Object.values(WalletOption),
  explorerUrls: EXPLORER_URLS,
  nodeUrls: NODE_URLS,
  rpcUrls: RPC_URLS,

  apiKeys: {
    blockchair: "",
    kado: "",
    keepKey: "",
    swapKit: "",
    walletConnectProjectId: "",
  },

  envs: {
    apiUrl: "https://api.swapkit.dev",
    devApiUrl: "https://dev-api.swapkit.dev",
    isDev: false,
    isStagenet: false,
  },

  integrations: {
    radix: {
      applicationName: "Swapkit Playground",
      applicationVersion: "0.0.1",
      dAppDefinitionAddress: "account_rdx128r289p58222hcvev7frs6kue76pl7pdcnw8725aw658v0zggkh9ws",
      network: {
        dashboardBase: "https://dashboard.radixdlt.com",
        networkId: 1,
        networkName: "mainnet",
      },
    },
  } as SKConfigIntegrations,
};
type SKState = typeof initialState;

export type SKConfigState = {
  apiKeys?: Partial<SKState["apiKeys"]>;
  chains?: SKState["chains"];
  apis?: Partial<SKState["apis"]>;
  envs?: Partial<SKState["envs"]>;
  explorerUrls?: Partial<SKState["explorerUrls"]>;
  integrations?: Partial<SKConfigIntegrations>;
  nodeUrls?: Partial<SKState["nodeUrls"]>;
  rpcUrls?: Partial<SKState["rpcUrls"]>;
  wallets?: SKState["wallets"];
};

type SwapKitConfigStore = SKState & {
  setApiKey: (key: keyof SKState["apiKeys"], apiKey: string) => void;
  setConfig: (config: SKConfigState) => void;
  setEnv: <T extends keyof SKState["envs"]>(key: T, value: SKState["envs"][T]) => void;
  setExplorerUrl: (chain: keyof SKState["explorerUrls"], url: string) => void;
  setNodeUrl: (chain: keyof SKState["nodeUrls"], url: string) => void;
  setRpcUrl: (chain: keyof SKState["rpcUrls"], url: string) => void;
  setIntegrationConfig: (
    integration: keyof SKState["integrations"],
    config: SKConfigIntegrations[keyof SKConfigIntegrations],
  ) => void;
};

const swapKitState = createStore<SwapKitConfigStore>((set) => ({
  ...initialState,

  setApiKey: (key, apiKey) => set((s) => ({ apiKeys: { ...s.apiKeys, [key]: apiKey } })),
  setEnv: (key, value) => set((s) => ({ envs: { ...s.envs, [key]: value } })),
  setExplorerUrl: (chain, url) =>
    set((s) => ({ explorerUrls: { ...s.explorerUrls, [chain]: url } })),
  setNodeUrl: (chain, url) => set((s) => ({ nodeUrls: { ...s.nodeUrls, [chain]: url } })),
  setRpcUrl: (chain, url) => set((s) => ({ rpcUrls: { ...s.rpcUrls, [chain]: url } })),
  setIntegrationConfig: (integration, config) =>
    set((s) => ({
      integrations: { ...s.integrations, [integration]: config },
    })),
  setConfig: (config) =>
    set((s) => ({
      apiKeys: { ...s.apiKeys, ...config.apiKeys },
      envs: { ...s.envs, ...config.envs },
      explorerUrls: { ...s.explorerUrls, ...config.explorerUrls },
      integrations: { ...s.integrations, ...config.integrations },
      nodeUrls: { ...s.nodeUrls, ...config.nodeUrls },
      rpcUrls: { ...s.rpcUrls, ...config.rpcUrls },
      chains: s.chains.concat(config.chains || []),
      wallets: s.wallets.concat(config.wallets || []),
    })),
}));

export const SKConfig = {
  getState: swapKitState.getState,
  get: <T extends keyof SKState>(key: T) => swapKitState.getState()[key],
  set: <T extends SKConfigState>(config: T) => swapKitState.getState().setConfig(config),

  setApiKey: <T extends keyof SKState["apiKeys"]>(key: T, apiKey: string) =>
    swapKitState.getState().setApiKey(key, apiKey),
  setEnv: <T extends keyof SKState["envs"]>(key: T, value: SKState["envs"][T]) =>
    swapKitState.getState().setEnv(key, value),
  setExplorerUrl: <T extends keyof SKState["explorerUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setExplorerUrl(chain, url),
  setNodeUrl: <T extends keyof SKState["nodeUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setNodeUrl(chain, url),
  setRpcUrl: <T extends keyof SKState["rpcUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setRpcUrl(chain, url),
  setIntegrationConfig: <T extends keyof SKState["integrations"]>(
    integration: T,
    config: SKConfigIntegrations[T],
  ) => swapKitState.getState().setIntegrationConfig(integration, config),
};
