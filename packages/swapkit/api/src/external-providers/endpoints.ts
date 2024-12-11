import { type ChainId, ChainIdToChain, RequestClient } from "@swapkit/helpers";
import type {
  SwapkitApiAddressDataResponse,
  SwapkitApiBalanceResponse,
  SwapkitApiRawTxResponse,
  SwapkitApiScanUTXOResponse,
  SwapkitApiSuggestedTxFeeResponse,
} from "./types";

const baseUrl = "https://api.swapkit.dev/external-providers";
const baseUrlDev = "https://dev-api.swapkit.dev/external-providers";

function getBaseUrl(isDev?: boolean) {
  return isDev ? baseUrlDev : baseUrl;
}

export const swaptkitExternalProvidersApi = ({
  apiKey,
  chainId,
  isDev,
}: {
  apiKey: string;
  chainId: ChainId;
  isDev?: boolean;
}) => ({
  getBalance: async (address: string) => {
    const chain = ChainIdToChain[chainId];
    const url = `${getBaseUrl(isDev)}/balance?chain=${chain}&address=${address}`;

    const data = await RequestClient.get<SwapkitApiBalanceResponse>(url, {
      headers: { "x-api-key": apiKey },
    });

    return (data || []).map(({ value, decimal, chain, symbol, identifier }) => ({
      value,
      decimal,
      chain,
      symbol,
      identifier,
    }));
  },
  getRawTx: async (hash: string) => {
    const chain = ChainIdToChain[chainId];
    const url = `${getBaseUrl(isDev)}/tx?chain=${chain}&hash=${hash}`;
    const data = await RequestClient.get<SwapkitApiRawTxResponse>(url, {
      headers: { "x-api-key": apiKey },
    });
    return data;
  },
  scanUTXOs: async (address: string, fetchTxHex = false) => {
    const chain = ChainIdToChain[chainId];
    const url = `${getBaseUrl(isDev)}/scanUTXO?chain=${chain}&address=${address}&fetchTxHex=${fetchTxHex}`;
    const data = await RequestClient.get<SwapkitApiScanUTXOResponse>(url, {
      headers: { "x-api-key": apiKey },
    });
    return data;
  },
  getAddressData: async (address: string) => {
    const chain = ChainIdToChain[chainId];
    const url = `${getBaseUrl(isDev)}/address?chain=${chain}&address=${address}`;
    const data = await RequestClient.get<SwapkitApiAddressDataResponse>(url, {
      headers: { "x-api-key": apiKey },
    });
    return data;
  },
  getSuggestedTxFee: async () => {
    const chain = ChainIdToChain[chainId];
    const url = `${getBaseUrl(isDev)}/suggestedFee?chain=${chain}`;
    const data = await RequestClient.get<SwapkitApiSuggestedTxFeeResponse>(url, {
      headers: { "x-api-key": apiKey },
    });
    return data;
  },
});

export type SwaptkitExternalProvidersApiType = ReturnType<typeof swaptkitExternalProvidersApi>;
