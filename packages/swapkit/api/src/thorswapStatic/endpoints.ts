import { AssetValue, type ProviderName, RequestClient, getChainIdentifier } from "@swapkit/helpers";

import { getTokenListProvidersV2 } from "../swapkitApi/endpoints";
import type { TokenListProvidersResponse } from "../swapkitApi/types";
import type { TokensResponse } from "./types";

const baseUrl = "https://static.thorswap.net";

export function getTokenList(tokenListName: string) {
  return RequestClient.get<TokensResponse>(`${baseUrl}/token-list/${tokenListName}.json`);
}

export function getLogoForAsset(assetString: string) {
  return `${baseUrl}/token-list/images/${assetString.toLowerCase()}.png`;
}

export function getChainLogoForAsset(assetString: string) {
  const { chain } = AssetValue.from({ asset: assetString });
  const chainIdentifier = getChainIdentifier(chain).toLowerCase();

  return `${baseUrl}/token-list/images/${chainIdentifier}.png`;
}

let providerData: TokenListProvidersResponse;

export async function getProviderLogo(providerName: ProviderName | string) {
  providerData ||= await getTokenListProvidersV2();

  return providerData.find((p) => p.name === providerName)?.url;
}
