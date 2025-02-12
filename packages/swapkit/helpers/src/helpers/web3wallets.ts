import type { BrowserProvider } from "ethers";
import { SwapKitError } from "../modules/swapKitError";
import {
  Chain,
  ChainId,
  type EIP6963AnnounceProviderEvent,
  type EIP6963Provider,
  WalletOption,
} from "../types";

export type EthereumWindowProvider = BrowserProvider & {
  __XDEFI?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isKeepKeyWallet?: boolean;
  isTrust?: boolean;
  isTalisman?: boolean;
  on: (event: string, callback?: () => void) => void;
  overrideIsMetaMask?: boolean;
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
  selectedProvider?: EthereumWindowProvider;
};

declare const window: {
  ethereum: EthereumWindowProvider;
  trustwallet: EthereumWindowProvider;
  coinbaseWalletExtension: EthereumWindowProvider;
  braveSolana: any;
  bitkeep?: { ethereum: EthereumWindowProvider };
  xfi?: { ethereum: EthereumWindowProvider };
} & Window;

type NetworkParams = {
  chainId: ChainId;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

type ProviderRequestParams = {
  provider?: BrowserProvider;
  params?: any;
  method:
    | "wallet_addEthereumChain"
    | "wallet_switchEthereumChain"
    | "eth_requestAccounts"
    | "eth_sendTransaction"
    | "eth_signTransaction";
};

const methodsToWrap = [
  "approve",
  "approvedAmount",
  "call",
  "sendTransaction",
  "transfer",
  "isApproved",
  "approvedAmount",
  "EIP1193SendTransaction",
  "getFeeData",
  "broadcastTransaction",
  "estimateCall",
  "estimateGasLimit",
  "estimateGasPrices",
  "createContractTxObject",
];

export const wrapMethodWithNetworkSwitch = <T extends (...args: any[]) => any>(
  func: T,
  provider: BrowserProvider,
  chainId: ChainId,
) =>
  (async (...args: any[]) => {
    try {
      await switchEVMWalletNetwork(provider, chainId);
    } catch (error) {
      throw new SwapKitError({
        errorKey: "helpers_failed_to_switch_network",
        info: { error },
      });
    }
    return func(...args);
  }) as unknown as T;

const providerRequest = ({ provider, params, method }: ProviderRequestParams) => {
  if (!provider?.send) {
    throw new SwapKitError("helpers_not_found_provider");
  }

  const providerParams = params ? (Array.isArray(params) ? params : [params]) : [];
  return provider.send(method, providerParams);
};

export const prepareNetworkSwitch = <T extends { [key: string]: (...args: any[]) => any }>({
  toolbox,
  chainId,
  provider = window.ethereum,
}: {
  toolbox: T;
  chainId: ChainId;
  provider?: BrowserProvider;
}) => {
  const wrappedMethods = methodsToWrap.reduce((object, methodName) => {
    if (!toolbox[methodName]) return object;
    const method = toolbox[methodName];

    if (typeof method !== "function") return object;

    return {
      // biome-ignore lint/performance/noAccumulatingSpread: This is a valid use case
      ...object,
      [methodName]: wrapMethodWithNetworkSwitch<typeof method>(method, provider, chainId),
    };
  }, {});

  return { ...toolbox, ...wrappedMethods };
};

export const addEVMWalletNetwork = (provider: BrowserProvider, networkParams: NetworkParams) =>
  providerRequest({ provider, method: "wallet_addEthereumChain", params: [networkParams] });

export const switchEVMWalletNetwork = (
  provider: BrowserProvider,
  chainId = ChainId.EthereumHex,
  networkParams?: NetworkParams,
) => {
  try {
    providerRequest({ provider, method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (_error) {
    if (!networkParams) {
      throw new Error("Failed to switch network, networkParams not provided");
    }
    addEVMWalletNetwork(provider, networkParams);
  }
};

export const addAccountsChangedCallback = (callback: () => void) => {
  window.ethereum?.on("accountsChanged", () => callback());
  window.xfi?.ethereum.on("accountsChanged", () => callback());
};

export const getETHDefaultWallet = () => {
  const { isTrust, isBraveWallet, __XDEFI, overrideIsMetaMask, selectedProvider } =
    window?.ethereum || {};
  if (isTrust) return WalletOption.TRUSTWALLET_WEB;
  if (isBraveWallet) return WalletOption.BRAVE;
  if (overrideIsMetaMask && selectedProvider?.isCoinbaseWallet) return WalletOption.COINBASE_WEB;
  if (__XDEFI) WalletOption.CTRL;
  return WalletOption.METAMASK;
};

export const isDetected = (walletOption: WalletOption) => {
  return listWeb3EVMWallets().includes(walletOption);
};

export const listWeb3EVMWallets = () => {
  const metamaskEnabled = window?.ethereum && !window.ethereum?.isBraveWallet;
  // @ts-ignore that should be implemented in ctrl and hooked up via swapkit core
  const ctrlEnabled = window?.xfi || window?.ethereum?.__XDEFI;
  const braveEnabled = window?.ethereum?.isBraveWallet;
  const trustEnabled = window?.ethereum?.isTrust || window?.trustwallet;
  const coinbaseEnabled =
    (window?.ethereum?.overrideIsMetaMask &&
      window?.ethereum?.selectedProvider?.isCoinbaseWallet) ||
    window?.coinbaseWalletExtension;
  const bitgetEnabled = window?.bitkeep?.ethereum;

  const wallets = [];
  if (metamaskEnabled) wallets.push(WalletOption.METAMASK);
  if (ctrlEnabled) wallets.push(WalletOption.CTRL);
  if (braveEnabled) wallets.push(WalletOption.BRAVE);
  if (trustEnabled) wallets.push(WalletOption.TRUSTWALLET_WEB);
  if (coinbaseEnabled) wallets.push(WalletOption.COINBASE_WEB);
  if (okxMobileEnabled()) wallets.push(WalletOption.OKX_MOBILE);
  if (bitgetEnabled) wallets.push(WalletOption.BITGET);

  return wallets;
};

export function pickEvmApiKey({
  chain,
  nonEthApiKey,
  ethApiKey,
}: { chain: Chain; nonEthApiKey?: string; ethApiKey?: string }) {
  const apiKey = chain === Chain.Ethereum ? ethApiKey : nonEthApiKey;

  return apiKey;
}

export function getEIP6963Wallets() {
  const providers: EIP6963Provider[] = [];

  function onAnnouncement(event: EIP6963AnnounceProviderEvent) {
    if (providers.map((p) => p.info.uuid).includes(event.detail.info.uuid)) return;
    providers.push(event.detail);
  }

  window.addEventListener("eip6963:announceProvider", onAnnouncement);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  function removeEIP6963EventListener() {
    window.removeEventListener("eip6963:announceProvider", onAnnouncement);
  }

  return { providers, removeEIP6963EventListener };
}

export const okxMobileEnabled = () => {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod|ios/i.test(ua);
  const isAndroid = /android|XiaoMi|MiuiBrowser/i.test(ua);
  const isMobile = isIOS || isAndroid;
  const isOKApp = /OKApp/i.test(ua);

  return isMobile && isOKApp;
};

export const isWeb3Detected = () => typeof window.ethereum !== "undefined";
