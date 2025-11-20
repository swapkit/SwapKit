import {
  AllChains,
  type Chain,
  getChainConfig,
  StagenetChain,
  StagenetMAYAConfig,
  StagenetTHORConfig,
} from "@swapkit/types";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import type { BalanceResponse, QuoteRequest, QuoteResponse, QuoteResponseRoute } from "../api";
import { WalletOption } from "../types";
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
  nearWalletSelector?: { contractId?: string };
  trezor?: { email: string; appUrl: string };
  keepKey?: { name: string; imageUrl: string; basePath: string; url: string };
  radix: {
    dAppDefinitionAddress: string;
    applicationName: string;
    applicationVersion: string;
    network: { networkId: number; networkName: string; dashboardBase: string };
  };
};

export type CustomApiEndpoints = {
  getBalance: ({ chain, address }: { chain: Chain; address: string }) => Promise<BalanceResponse>;
  getQuote: (json: QuoteRequest) => Promise<QuoteResponse>;
  getRouteWithTx: (json: { routeId: string }) => Promise<QuoteResponseRoute>;
};

const rpcUrls = AllChains.reduce(
  (acc, chain) => {
    if (!acc.THOR_STAGENET) {
      acc[StagenetChain.Maya] = StagenetMAYAConfig.rpcUrls;
      acc[StagenetChain.THORChain] = StagenetTHORConfig.rpcUrls;
    }

    acc[chain] = getChainConfig(chain).rpcUrls;
    return acc;
  },
  {} as { [key in Chain | StagenetChain]: string[] },
);

const initialState = {
  apiKeys: { blockchair: "", keepKey: "", passkeys: "", swapKit: "", walletConnectProjectId: "", xaman: "" },
  chains: AllChains,
  endpoints: {} as CustomApiEndpoints,
  envs: {
    apiUrl: "https://api.swapkit.dev",
    devApiUrl: "https://dev-api.swapkit.dev",
    experimental_apiKey: null as string | null,
    experimental_apiUrlQuote: null as string | null,
    experimental_apiUrlSwap: null as string | null,
    isDev: false,
    isStagenet: false,
  },
  feeMultipliers: undefined as FeeMultiplierConfig | undefined,
  integrations: {
    radix: {
      applicationName: "Swapkit Playground",
      applicationVersion: "0.0.1",
      dAppDefinitionAddress: "account_rdx128r289p58222hcvev7frs6kue76pl7pdcnw8725aw658v0zggkh9ws",
      network: { dashboardBase: "https://dashboard.radixdlt.com", networkId: 1, networkName: "mainnet" },
    },
  } as SKConfigIntegrations,

  requestOptions: { retry: { backoffMultiplier: 2, baseDelay: 300, maxDelay: 5000, maxRetries: 3 }, timeoutMs: 30000 },
  rpcUrls,
  wallets: Object.values(WalletOption),
};
type SKState = typeof initialState;

export type SKConfigState = {
  apiKeys?: Partial<SKState["apiKeys"]>;
  chains?: SKState["chains"];
  endpoints?: Partial<CustomApiEndpoints>;
  envs?: Partial<SKState["envs"]>;
  integrations?: Partial<SKConfigIntegrations>;
  rpcUrls?: Partial<SKState["rpcUrls"]>;
  wallets?: SKState["wallets"];
  feeMultipliers?: FeeMultiplierConfig;
};

type SwapKitConfigStore = SKState & {
  setApiKey: (key: keyof SKState["apiKeys"], apiKey: string) => void;
  setConfig: (config: SKConfigState) => void;
  setEnv: <T extends keyof SKState["envs"]>(key: T, value: SKState["envs"][T]) => void;
  setEndpoint: <T extends keyof CustomApiEndpoints>(key: T, endpoint: CustomApiEndpoints[T]) => void;
  setRpcUrl: (chain: keyof SKState["rpcUrls"], url: string[]) => void;
  setRequestOptions: (options: Partial<SKState["requestOptions"]>) => void;
  setIntegrationConfig: (
    integration: keyof SKState["integrations"],
    config: SKConfigIntegrations[keyof SKConfigIntegrations],
  ) => void;
  setFeeMultipliers: (multipliers: FeeMultiplierConfig) => void;
};

export const useSwapKitStore = create<SwapKitConfigStore>((set) => ({
  ...initialState,

  setApiKey: (key, apiKey) => set((s) => ({ apiKeys: { ...s.apiKeys, [key]: apiKey } })),
  setConfig: (config) =>
    set((s) => ({
      apiKeys: { ...s.apiKeys, ...config?.apiKeys },
      chains: s.chains.concat(config?.chains || []),
      endpoints: { ...s.endpoints, ...config?.endpoints },
      envs: { ...s.envs, ...config?.envs },
      feeMultipliers: config?.feeMultipliers || s.feeMultipliers,
      integrations: { ...s.integrations, ...config?.integrations },
      rpcUrls: { ...s.rpcUrls, ...config?.rpcUrls },
      wallets: s.wallets.concat(config?.wallets || []),
    })),
  setEndpoint: (key, endpoint) => set((s) => ({ endpoints: { ...s.endpoints, [key]: endpoint } })),
  setEnv: (key, value) => set((s) => ({ envs: { ...s.envs, [key]: value } })),
  setFeeMultipliers: (multipliers) => set(() => ({ feeMultipliers: multipliers })),
  setIntegrationConfig: (integration, config) =>
    set((s) => ({ integrations: { ...s.integrations, [integration]: config } })),
  setRequestOptions: (options) =>
    set((s) => ({
      requestOptions: {
        retry: { ...s.requestOptions.retry, ...options.retry },
        timeoutMs: options.timeoutMs || s.requestOptions.timeoutMs,
      },
    })),
  setRpcUrl: (chain, url) => set((s) => ({ rpcUrls: { ...s.rpcUrls, [chain]: url } })),
}));

export const useSwapKitConfig = () =>
  useSwapKitStore(
    useShallow((state) => ({
      apiKeys: state?.apiKeys,
      chains: state?.chains,
      endpoints: state?.endpoints,
      envs: state?.envs,
      feeMultipliers: state?.feeMultipliers,
      integrations: state?.integrations,
      rpcUrls: state?.rpcUrls,
      wallets: state?.wallets,
    })),
  );

export const SKConfig = {
  get: <T extends keyof SKState>(key: T) => useSwapKitStore.getState()[key],
  getState: useSwapKitStore.getState,
  reinitialize: () => useSwapKitStore.setState(initialState),
  set: <T extends SKConfigState>(config: T) => useSwapKitStore.getState().setConfig(config),

  setApiKey: <T extends keyof SKState["apiKeys"]>(key: T, apiKey: string) =>
    useSwapKitStore.getState().setApiKey(key, apiKey),
  setEndpoint: <T extends keyof CustomApiEndpoints>(key: T, endpoint: CustomApiEndpoints[T]) =>
    useSwapKitStore.getState().setEndpoint(key, endpoint),
  setEnv: <T extends keyof SKState["envs"]>(key: T, value: SKState["envs"][T]) =>
    useSwapKitStore.getState().setEnv(key, value),
  setFeeMultipliers: (multipliers: FeeMultiplierConfig) => useSwapKitStore.getState().setFeeMultipliers(multipliers),
  setIntegrationConfig: <T extends keyof SKState["integrations"]>(integration: T, config: SKConfigIntegrations[T]) =>
    useSwapKitStore.getState().setIntegrationConfig(integration, config),
  setRequestOptions: (options: SKState["requestOptions"]) => useSwapKitStore.getState().setRequestOptions(options),
  setRpcUrl: <T extends keyof SKState["rpcUrls"]>(chain: T, urls: string[]) =>
    useSwapKitStore.getState().setRpcUrl(chain, urls),
};
