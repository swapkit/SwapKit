import type { ProposalTypes } from "@walletconnect/types";

import { SwapKitError } from "@swapkit/helpers";
import {
  DEFAULT_COSMOS_METHODS,
  DEFAULT_EIP155_METHODS,
  DEFAULT_EIP_155_EVENTS,
  DEFAULT_NEAR_EVENTS,
  DEFAULT_NEAR_METHODS,
  DEFAULT_POLKADOT_EVENTS,
  DEFAULT_POLKADOT_METHODS,
  DEFAULT_SOLANA_EVENTS,
  DEFAULT_SOLANA_METHODS,
} from "./constants";

export const getNamespacesFromChains = (chains: string[]) => {
  const supportedNamespaces: string[] = [];
  for (const chainId of chains) {
    const [namespace] = chainId.split(":");
    if (namespace && !supportedNamespaces.includes(namespace)) {
      supportedNamespaces.push(namespace);
    }
  }

  return supportedNamespaces;
};

export const getSupportedMethodsByNamespace = (namespace: string) => {
  switch (namespace) {
    case "eip155":
      return Object.values(DEFAULT_EIP155_METHODS);
    case "cosmos":
      return Object.values(DEFAULT_COSMOS_METHODS);
    case "solana":
      return Object.values(DEFAULT_SOLANA_METHODS);
    case "polkadot":
      return Object.values(DEFAULT_POLKADOT_METHODS);
    case "near":
      return Object.values(DEFAULT_NEAR_METHODS);
    default:
      throw new SwapKitError({
        errorKey: "wallet_walletconnect_namespace_not_supported",
        info: { namespace },
      });
  }
};

export const getSupportedEventsByNamespace = (namespace: string) => {
  switch (namespace) {
    case "eip155":
      return Object.values(DEFAULT_EIP_155_EVENTS);
    case "cosmos":
      return [];
    case "solana":
      return Object.values(DEFAULT_SOLANA_EVENTS);
    case "polkadot":
      return Object.values(DEFAULT_POLKADOT_EVENTS);
    case "near":
      return Object.values(DEFAULT_NEAR_EVENTS);
    default:
      throw new SwapKitError({
        errorKey: "wallet_walletconnect_namespace_not_supported",
        info: { namespace },
      });
  }
};

export const getRequiredNamespaces = (chains: string[]): ProposalTypes.RequiredNamespaces => {
  const selectedNamespaces = getNamespacesFromChains(chains);

  return Object.fromEntries(
    selectedNamespaces.map((namespace) => [
      namespace,
      {
        methods: getSupportedMethodsByNamespace(namespace),
        chains: chains.filter((chain) => chain.startsWith(namespace)),
        events: getSupportedEventsByNamespace(namespace) as any[],
      },
    ]),
  );
};
