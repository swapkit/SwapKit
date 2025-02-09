import { createStore } from "zustand/vanilla";
import { EXPLORER_URLS, NODE_URLS, RPC_URLS } from "../types";

type Integrations = {
  chainflip?: { useSDKBroker?: boolean; brokerUrl: string };
  trezor?: { email: string; appUrl: string };
  keepkey?: { name: string; imageUrl: string; basePath: string; url: string };
  radix?: {
    dAppDefinitionAddress: string;
    applicationName: string;
    applicationVersion: string;
    network: { networkId: number; networkName: string; dashboardBase: string };
  };
};

const initialState = {
  explorerUrls: EXPLORER_URLS,
  integrations: {} as Integrations,
  nodeUrls: NODE_URLS,
  rpcUrls: RPC_URLS,
  apiKeys: {
    blockchair: "",
    covalent: "",
    ethplorer: "freekey",
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
    referer: "https://swapkit.dev",
  },
};
type SKState = typeof initialState;

export type SKConfigState = {
  apiKeys?: Partial<SKState["apiKeys"]>;
  envs?: Partial<SKState["envs"]>;
  explorerUrls?: Partial<SKState["explorerUrls"]>;
  integrations?: Partial<Integrations>;
  nodeUrls?: Partial<SKState["nodeUrls"]>;
  rpcUrls?: Partial<SKState["rpcUrls"]>;
};

type SwapKitConfigStore = SKState & {
  setApiKey: (key: keyof SKState["apiKeys"], apiKey: string) => void;
  setConfig: (config: SKConfigState) => void;
  setExplorerUrl: (chain: keyof SKState["explorerUrls"], url: string) => void;
  setNodeUrl: (chain: keyof SKState["nodeUrls"], url: string) => void;
  setRpcUrl: (chain: keyof SKState["rpcUrls"], url: string) => void;
  setIntegrationConfig: (
    integration: keyof SKState["integrations"],
    config: Integrations[keyof Integrations],
  ) => void;
};

const swapKitState = createStore<SwapKitConfigStore>((set) => ({
  ...initialState,

  setApiKey: (key, apiKey) => set((s) => ({ apiKeys: { ...s.apiKeys, [key]: apiKey } })),
  setExplorerUrl: (chain, url) =>
    set((s) => ({ explorerUrls: { ...s.explorerUrls, [chain]: url } })),
  setNodeUrl: (chain, url) => set((s) => ({ nodeUrls: { ...s.nodeUrls, [chain]: url } })),
  setRpcUrl: (chain, url) => set((s) => ({ rpcUrls: { ...s.rpcUrls, [chain]: url } })),
  setIntegrationConfig: (integration, config) =>
    set((s) => ({ integrations: { ...s.integrations, [integration]: config } })),
  setConfig: (config) =>
    set((s) => ({
      apiKeys: { ...s.apiKeys, ...config.apiKeys },
      envs: { ...s.envs, ...config.envs },
      explorerUrls: { ...s.explorerUrls, ...config.explorerUrls },
      nodeUrls: { ...s.nodeUrls, ...config.nodeUrls },
      rpcUrls: { ...s.rpcUrls, ...config.rpcUrls },
      integrations: { ...s.integrations, ...config.integrations },
    })),
}));

export const SKConfig = {
  get: <T extends keyof SKState>(key: T) => swapKitState.getState()[key],
  set: <T extends SKConfigState>(config: T) => swapKitState.getState().setConfig(config),

  getState: () => swapKitState.getState(),
  setApiKey: <T extends keyof SKState["apiKeys"]>(key: T, apiKey: string) =>
    swapKitState.getState().setApiKey(key, apiKey),
  setExplorerUrl: <T extends keyof SKState["explorerUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setExplorerUrl(chain, url),
  setNodeUrl: <T extends keyof SKState["nodeUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setNodeUrl(chain, url),
  setRpcUrl: <T extends keyof SKState["rpcUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setRpcUrl(chain, url),
  setIntegrationConfig: <T extends keyof SKState["integrations"]>(
    integration: T,
    config: Integrations[T],
  ) => swapKitState.getState().setIntegrationConfig(integration, config),
};
