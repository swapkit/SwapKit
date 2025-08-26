import { type Chain, getChainConfig } from "@swapkit/types";
import type { BrowserProvider, JsonRpcProvider } from "ethers";
import { SwapKitError } from "../modules/swapKitError";
import {
  type EIP6963AnnounceProviderEvent,
  type EIP6963Provider,
  type EthereumWindowProvider,
  type NetworkParams,
  WalletOption,
} from "../types";
import { warnOnce } from "./others";

declare const window: {
  ethereum: EthereumWindowProvider;
  trustwallet: EthereumWindowProvider;
  coinbaseWalletExtension: EthereumWindowProvider;
  braveSolana: any;
  bitkeep?: { ethereum: EthereumWindowProvider };
  xfi?: { ethereum: EthereumWindowProvider };
  $onekey?: { ethereum: EthereumWindowProvider };
  vultisig?: { ethereum: EthereumWindowProvider };
} & Window;

export function isWeb3Detected() {
  return typeof window.ethereum !== "undefined";
}

export function isDetected(walletOption: WalletOption) {
  return listWeb3EVMWallets().includes(walletOption);
}

export function listWeb3EVMWallets() {
  const metamaskEnabled = window?.ethereum && !window.ethereum?.isBraveWallet;
  const ctrlEnabled = window?.xfi || window?.ethereum?.__XDEFI;
  const vultisigEnabled = window?.vultisig;
  const braveEnabled = window?.ethereum?.isBraveWallet;
  const trustEnabled = window?.ethereum?.isTrust || window?.trustwallet;
  const coinbaseEnabled =
    (window?.ethereum?.overrideIsMetaMask && window?.ethereum?.selectedProvider?.isCoinbaseWallet) ||
    window?.coinbaseWalletExtension;
  const bitgetEnabled = window?.bitkeep?.ethereum;
  const onekeyEnabled = window?.$onekey?.ethereum;

  const wallets = [];
  if (metamaskEnabled) wallets.push(WalletOption.METAMASK);
  if (ctrlEnabled) wallets.push(WalletOption.CTRL);
  if (vultisigEnabled) wallets.push(WalletOption.VULTISIG);
  if (braveEnabled) wallets.push(WalletOption.BRAVE);
  if (trustEnabled) wallets.push(WalletOption.TRUSTWALLET_WEB);
  if (coinbaseEnabled) wallets.push(WalletOption.COINBASE_WEB);
  if (okxMobileEnabled()) wallets.push(WalletOption.OKX_MOBILE);
  if (bitgetEnabled) wallets.push(WalletOption.BITGET);
  if (onekeyEnabled) wallets.push(WalletOption.ONEKEY);

  return wallets;
}

export async function switchEVMWalletNetwork(provider: BrowserProvider, chain: Chain, networkParams?: NetworkParams) {
  const chainConfig = getChainConfig(chain);

  try {
    await providerRequest({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainConfig.chainId }],
      provider,
    });
  } catch (error) {
    if (!networkParams) {
      throw new SwapKitError("helpers_failed_to_switch_network", {
        error: error,
        reason: "networkParams not provided",
      });
    }
    await addEVMWalletNetwork(provider, networkParams);
  }
}

export function filterSupportedChains<T extends string[]>({
  chains,
  supportedChains,
  walletType,
}: {
  chains: Chain[];
  supportedChains: T;
  walletType?: WalletOption;
}) {
  const supported = chains.filter((chain) => !chain || supportedChains.includes(chain));

  if (supported.length === 0) {
    throw new SwapKitError("wallet_chain_not_supported", { chain: chains.join(", "), wallet: walletType });
  }

  const unsupported = chains.filter((chain) => !supportedChains.includes(chain));

  warnOnce({
    condition: unsupported.length > 0,
    id: `wallet_chain_not_supported_${walletType}`,
    warning: `${walletType} wallet does not support the following chains: ${unsupported.join(
      ", ",
    )}. These chains will be ignored.`,
  });

  return supported as T;
}

export function wrapMethodWithNetworkSwitch<T extends (...args: any[]) => any>(
  func: T,
  provider: BrowserProvider,
  chain: Chain,
) {
  return (async (...args: any[]) => {
    const { chainIdHex } = getChainConfig(chain);
    if ((await provider.getNetwork()).chainId.toString() === chainIdHex) {
      return func(...args);
    }
    try {
      await switchEVMWalletNetwork(provider, chain);
    } catch (error) {
      throw new SwapKitError({ errorKey: "helpers_failed_to_switch_network", info: { error } });
    }
    return func(...args);
  }) as unknown as T;
}

export function prepareNetworkSwitch<T extends Record<string, unknown>, M extends keyof T>({
  toolbox,
  chain,
  provider = window.ethereum,
  methodNames = [],
}: {
  toolbox: T;
  chain: Chain;
  provider?: BrowserProvider | JsonRpcProvider;
  methodNames?: M[];
}) {
  const methodsToWrap = [
    ...methodNames,
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
  ] as M[];
  const wrappedMethods = methodsToWrap.reduce((object, methodName) => {
    if (!toolbox[methodName]) return object;

    const method = toolbox[methodName];

    if (typeof method !== "function") return object;

    // @ts-expect-error
    const wrappedMethod = wrapMethodWithNetworkSwitch(method, provider, chain);

    // biome-ignore lint/performance/noAccumulatingSpread: valid use case
    return { ...object, [methodName]: wrappedMethod };
  }, {});

  return { ...toolbox, ...wrappedMethods };
}

export function addEVMWalletNetwork(provider: BrowserProvider, networkParams: NetworkParams) {
  return providerRequest({ method: "wallet_addEthereumChain", params: [networkParams], provider });
}

export function addAccountsChangedCallback(callback: () => void) {
  window.ethereum?.on("accountsChanged", () => callback());
  window.xfi?.ethereum.on("accountsChanged", () => callback());
}

export function getETHDefaultWallet() {
  const { isTrust, isBraveWallet, __XDEFI, overrideIsMetaMask, selectedProvider } = window?.ethereum || {};
  if (isTrust) return WalletOption.TRUSTWALLET_WEB;
  if (isBraveWallet) return WalletOption.BRAVE;
  if (overrideIsMetaMask && selectedProvider?.isCoinbaseWallet) return WalletOption.COINBASE_WEB;
  if (__XDEFI) WalletOption.CTRL;
  if (window?.$onekey?.ethereum) return WalletOption.ONEKEY;
  return WalletOption.METAMASK;
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

export function okxMobileEnabled() {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod|ios/i.test(ua);
  const isAndroid = /android|XiaoMi|MiuiBrowser/i.test(ua);
  const isMobile = isIOS || isAndroid;
  const isOKApp = /OKApp/i.test(ua);

  return isMobile && isOKApp;
}

export function providerRequest({
  provider,
  params,
  method,
}: {
  provider?: BrowserProvider;
  params?: any;
  method:
    | "wallet_addEthereumChain"
    | "wallet_switchEthereumChain"
    | "eth_requestAccounts"
    | "eth_sendTransaction"
    | "eth_signTransaction";
}) {
  if (!provider?.send) {
    throw new SwapKitError("helpers_not_found_provider");
  }

  const providerParams = params ? (Array.isArray(params) ? params : [params]) : [];
  return provider.send(method, providerParams);
}
