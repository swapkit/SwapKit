import { Chain } from "@swapkit/types";
import { createStore } from "zustand/vanilla";
import { EXPLORER_URLS, FALLBACK_URLS, NODE_URLS, RPC_URLS, WalletOption } from "../types";
import type { FeeMultiplierConfig } from "./feeMultiplier";

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
  apiKeys: { blockchair: "", keepKey: "", swapKit: "", walletConnectProjectId: "", xaman: "" },
  // TODO: figure out how to type apis without using toolbox directly
  // Maybe move rpc/toolbox apis to helpers?
  apis: {} as { [key in Chain]: any },
  chains: Object.values(Chain),

  envs: {
    apiUrl: "https://api.swapkit.dev",
    devApiUrl: "https://dev-api.swapkit.dev",
    isDev: false,
    isStagenet: false,
  },
  explorerUrls: EXPLORER_URLS,
  fallbackRpcUrls: FALLBACK_URLS,

  feeMultipliers: undefined as FeeMultiplierConfig | undefined,

  integrations: {
    radix: {
      applicationName: "Swapkit Playground",
      applicationVersion: "0.0.1",
      dAppDefinitionAddress: "account_rdx128r289p58222hcvev7frs6kue76pl7pdcnw8725aw658v0zggkh9ws",
      network: { dashboardBase: "https://dashboard.radixdlt.com", networkId: 1, networkName: "mainnet" },
    },
  } as SKConfigIntegrations,
  nodeUrls: NODE_URLS,

  requestOptions: { retry: { backoffMultiplier: 2, baseDelay: 300, maxDelay: 5000, maxRetries: 3 }, timeoutMs: 30000 },
  rpcUrls: RPC_URLS,
  wallets: Object.values(WalletOption),
};
type SKState = typeof initialState;

export type SKConfigState = {
  apiKeys?: Partial<SKState["apiKeys"]>;
  chains?: SKState["chains"];
  envs?: Partial<SKState["envs"]>;
  explorerUrls?: Partial<SKState["explorerUrls"]>;
  integrations?: Partial<SKConfigIntegrations>;
  nodeUrls?: Partial<SKState["nodeUrls"]>;
  rpcUrls?: Partial<SKState["rpcUrls"]>;
  fallbackRpcUrls?: Partial<SKState["fallbackRpcUrls"]>;
  wallets?: SKState["wallets"];
  feeMultipliers?: FeeMultiplierConfig;
};

type SwapKitConfigStore = SKState & {
  setApiKey: (key: keyof SKState["apiKeys"], apiKey: string) => void;
  setConfig: (config: SKConfigState) => void;
  setEnv: <T extends keyof SKState["envs"]>(key: T, value: SKState["envs"][T]) => void;
  setExplorerUrl: (chain: keyof SKState["explorerUrls"], url: string) => void;
  setNodeUrl: (chain: keyof SKState["nodeUrls"], url: string) => void;
  setRpcUrl: (chain: keyof SKState["rpcUrls"], url: string) => void;
  setRequestOptions: (options: Partial<SKState["requestOptions"]>) => void;
  setFallbackRpcUrls: <T extends keyof SKState["fallbackRpcUrls"]>(
    chain: T,
    urls: SKState["fallbackRpcUrls"][T],
  ) => void;
  setIntegrationConfig: (
    integration: keyof SKState["integrations"],
    config: SKConfigIntegrations[keyof SKConfigIntegrations],
  ) => void;
  setFeeMultipliers: (multipliers: FeeMultiplierConfig) => void;
};

const swapKitState = createStore<SwapKitConfigStore>((set) => ({
  ...initialState,

  setApiKey: (key, apiKey) => set((s) => ({ apiKeys: { ...s.apiKeys, [key]: apiKey } })),
  setConfig: (config) =>
    set((s) => ({
      apiKeys: { ...s.apiKeys, ...config.apiKeys },
      chains: s.chains.concat(config.chains || []),
      envs: { ...s.envs, ...config.envs },
      explorerUrls: { ...s.explorerUrls, ...config.explorerUrls },
      feeMultipliers: config.feeMultipliers || s.feeMultipliers,
      integrations: { ...s.integrations, ...config.integrations },
      nodeUrls: { ...s.nodeUrls, ...config.nodeUrls } as typeof s.nodeUrls,
      rpcUrls: { ...s.rpcUrls, ...config.rpcUrls },
      wallets: s.wallets.concat(config.wallets || []),
    })),
  setEnv: (key, value) => set((s) => ({ envs: { ...s.envs, [key]: value } })),
  setExplorerUrl: (chain, url) => set((s) => ({ explorerUrls: { ...s.explorerUrls, [chain]: url } })),
  setFallbackRpcUrls: (chain, urls) => set((s) => ({ fallbackRpcUrls: { ...s.fallbackRpcUrls, [chain]: urls } })),
  setFeeMultipliers: (multipliers) => set(() => ({ feeMultipliers: multipliers })),
  setIntegrationConfig: (integration, config) =>
    set((s) => ({ integrations: { ...s.integrations, [integration]: config } })),
  setNodeUrl: (chain, url) => set((s) => ({ nodeUrls: { ...s.nodeUrls, [chain]: url } as typeof s.nodeUrls })),
  setRequestOptions: (options) =>
    set((s) => ({
      requestOptions: {
        retry: { ...s.requestOptions.retry, ...options.retry },
        timeoutMs: options.timeoutMs || s.requestOptions.timeoutMs,
      },
    })),
  setRpcUrl: (chain, url) => set((s) => ({ rpcUrls: { ...s.rpcUrls, [chain]: url } })),
}));

export const SKConfig = {
  get: <T extends keyof SKState>(key: T) => swapKitState.getState()[key],
  getState: swapKitState.getState,
  set: <T extends SKConfigState>(config: T) => swapKitState.getState().setConfig(config),

  setApiKey: <T extends keyof SKState["apiKeys"]>(key: T, apiKey: string) =>
    swapKitState.getState().setApiKey(key, apiKey),
  setEnv: <T extends keyof SKState["envs"]>(key: T, value: SKState["envs"][T]) =>
    swapKitState.getState().setEnv(key, value),
  setExplorerUrl: <T extends keyof SKState["explorerUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setExplorerUrl(chain, url),
  setFallbackRpcUrls: <T extends keyof SKState["fallbackRpcUrls"]>(chain: T, urls: SKState["fallbackRpcUrls"][T]) =>
    swapKitState.getState().setFallbackRpcUrls(chain, urls),
  setFeeMultipliers: (multipliers: FeeMultiplierConfig) => swapKitState.getState().setFeeMultipliers(multipliers),
  setIntegrationConfig: <T extends keyof SKState["integrations"]>(integration: T, config: SKConfigIntegrations[T]) =>
    swapKitState.getState().setIntegrationConfig(integration, config),
  setNodeUrl: <T extends keyof SKState["nodeUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setNodeUrl(chain, url),
  setRequestOptions: (options: SKState["requestOptions"]) => swapKitState.getState().setRequestOptions(options),
  setRpcUrl: <T extends keyof SKState["rpcUrls"]>(chain: T, url: string) =>
    swapKitState.getState().setRpcUrl(chain, url),
};
