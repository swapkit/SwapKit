import type { Chain, ProviderName, TokenNames, WalletOption } from "@swapkit/helpers";

const getAssetsBaseUrl = () => {
  if (import.meta.env.MODE === "development") {
    return "https://storage.googleapis.com/token-list-swapkit-dev";
  }

  return "https://storage.googleapis.com/token-list-swapkit";
};

export const getTokenLogoUrl = (token: TokenNames | (string & {})) => {
  return `${getAssetsBaseUrl()}/images/${token?.toLowerCase()}.png`;
};

export const getProviderLogoUrl = (provider: ProviderName | (string & {})) => {
  return `${getAssetsBaseUrl()}/images/providers/${provider?.toLowerCase()}.png`;
};

export const getChainLogoUrl = (chain: Chain | (string & {})) => {
  return `${getAssetsBaseUrl()}/images/chains/${chain?.toLowerCase()}.${chain?.toLowerCase()}.png`;
};

export const getWalletLogoUrl = (wallet: WalletOption | (string & {})) => {
  return `${getAssetsBaseUrl()}/images/wallets/${wallet?.toLowerCase()}.png`;
};
