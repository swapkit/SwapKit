import crypto from "crypto";
import { ProviderName, RequestClient, SwapKitError } from "@swapkit/helpers";

import {
  type BrokerDepositChannelParams,
  type DepositChannelResponse,
  DepositChannelResponseSchema,
  type GasResponse,
  GasResponseSchema,
  type PriceRequest,
  type PriceResponse,
  PriceResponseSchema,
  type QuoteRequest,
  type QuoteResponse,
  QuoteResponseSchema,
  type TokenListProvidersResponse,
  type TokensResponseV2,
  type TrackerParams,
  type TrackerResponse,
} from "./types";
const baseUrl = "https://api.swapkit.dev";
const baseUrlDev = "https://dev-api.swapkit.dev";

function getBaseUrl(isDev?: boolean) {
  return isDev ? baseUrlDev : baseUrl;
}

const getAuthHeaders = (hash?: string, apiKey?: string, referer?: string) => ({
  ...(apiKey && !hash ? { "x-api-key": apiKey } : {}),
  ...(hash && referer ? { "x-payload-hash": hash, referer } : {}),
});

export const computeHash = (
  hashParams:
    | {
        apiKey: string;
        method: "POST";
        payload: any;
      }
    | {
        apiKey: string;
        method: "GET";
        url: string;
      },
): string => {
  const { method } = hashParams;
  switch (method) {
    case "POST":
      return computeHashForPost(hashParams);
    case "GET":
      return computeHashForGet(hashParams);
    default:
      throw new SwapKitError("api_v2_invalid_method_key_hash", {
        message: `Invalid method: ${method}`,
      });
  }
};

export const computeHashForGet = ({
  url,
  apiKey,
}: {
  url: string;
  apiKey: string;
}): string => {
  return crypto.createHash("sha256").update(`${url}${apiKey}`, "utf8").digest("hex");
};

export const computeHashForPost = ({
  apiKey,
  payload,
}: {
  apiKey: string;
  payload: any;
}): string => {
  const normalizedBody = JSON.stringify(payload);
  return crypto.createHash("sha256").update(`${normalizedBody}${apiKey}`, "utf8").digest("hex");
};

export function getTrackerDetails(payload: TrackerParams, apiKey?: string, referer?: string) {
  const url = `${getBaseUrl()}/track`;
  const hash =
    referer && apiKey
      ? computeHash({
          method: "POST",
          apiKey,
          payload,
        })
      : undefined;
  return RequestClient.post<TrackerResponse>(url, {
    json: payload,
    headers: getAuthHeaders(hash, apiKey, referer),
  });
}

/**
 * @deprecated Use getSwapQuote instead
 */
export function getSwapQuoteV2<T extends boolean>(
  searchParams: QuoteRequest,
  isDev?: T,
  apiKey?: string,
  referer?: string,
) {
  return getSwapQuote(searchParams, isDev, apiKey, referer);
}

export async function getSwapQuote<T extends boolean>(
  searchParams: QuoteRequest,
  isDev?: T,
  apiKey?: string,
  referer?: string,
) {
  const url = `${getBaseUrl(isDev)}/quote`;
  const hash =
    referer && apiKey
      ? computeHash({
          method: "POST",
          apiKey: apiKey,
          payload: searchParams,
        })
      : undefined;
  const response = await RequestClient.post<QuoteResponse>(url, {
    json: searchParams,
    headers: getAuthHeaders(hash, apiKey, referer),
  });

  if (response.error) {
    throw new SwapKitError("api_v2_server_error", { message: response.error });
  }

  try {
    const parsedResponse = QuoteResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    return parsedResponse.data;
  } catch (error) {
    // throw new SwapKitError("api_v2_invalid_response", error);
    console.warn(error);
    return response;
  }
}

export function getTokenListProvidersV2(isDev = false, apiKey?: string, referer?: string) {
  const url = `${getBaseUrl(isDev)}/providers`;
  const hash =
    referer && apiKey
      ? computeHash({
          method: "GET",
          apiKey,
          url,
        })
      : undefined;
  return RequestClient.get<TokenListProvidersResponse>(url, {
    headers: getAuthHeaders(hash, apiKey, referer),
  });
}

/**
 * @deprecated Use getTokenList instead
 */
export function getTokenListV2(
  provider: ProviderName,
  isDev = false,
  apiKey?: string,
  referer?: string,
) {
  return getTokenList(provider, isDev, apiKey, referer);
}

export function getTokenList(
  provider: ProviderName,
  isDev = false,
  apiKey?: string,
  referer?: string,
) {
  const url = `${getBaseUrl(isDev)}/tokens?provider=${provider}`;
  const hash =
    referer && apiKey
      ? computeHash({
          method: "GET",
          apiKey,
          url,
        })
      : undefined;
  return RequestClient.get<TokensResponseV2>(url, {
    headers: getAuthHeaders(hash, apiKey, referer),
  });
}

export async function getPrice(
  body: PriceRequest,
  isDev = false,
  apiKey?: string,
  referer?: string,
) {
  const url = `${getBaseUrl(isDev)}/price`;
  const hash =
    referer && apiKey
      ? computeHash({
          method: "POST",
          apiKey,
          payload: body,
        })
      : undefined;
  const response = await RequestClient.post<PriceResponse>(url, {
    json: body,
    headers: getAuthHeaders(hash, apiKey, referer),
  });

  try {
    const parsedResponse = PriceResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    return parsedResponse.data;
  } catch (error) {
    throw new SwapKitError("api_v2_invalid_response", error);
  }
}

export async function getGasRate(isDev = false, apiKey?: string, referer?: string) {
  const url = `${getBaseUrl(isDev)}/gas`;
  const hash =
    referer && apiKey
      ? computeHash({
          method: "GET",
          apiKey,
          url,
        })
      : undefined;

  const response = await RequestClient.get<GasResponse>(url, {
    headers: getAuthHeaders(hash, apiKey, referer),
  });

  try {
    const parsedResponse = GasResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    return parsedResponse.data;
  } catch (error) {
    throw new SwapKitError("api_v2_invalid_response", error);
  }
}

// TODO update this once the trading pairs are supported by BE api
export async function getTokenTradingPairs(
  providers: ProviderName[],
  isDev = false,
  apiKey?: string,
  referer?: string,
) {
  const tradingPairs = new Map<
    string,
    {
      tokens: TokensResponseV2["tokens"];
      providers: ProviderName[];
    }
  >();

  if (!providers.length) return tradingPairs;

  const providerRequests = providers.map(async (provider) => {
    const tokenList = await getTokenListV2(provider, isDev, apiKey, referer);
    return tokenList;
  });

  const providersData = (await Promise.all(providerRequests))
    .filter((provider) => !!provider)
    .map(({ tokens, ...rest }) => ({
      data: {
        ...(rest || {}),
        tokens: tokens.map(({ address, ...rest }) => ({
          ...rest,
          ...(address &&
          [
            "resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd",
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          ].includes(address.toLowerCase())
            ? {}
            : { address }),
        })),
      },
      ...rest,
    }));

  const UNCHAINABLE_PROVIDERS = [
    ProviderName.CAVIAR_V1,
    ProviderName.CHAINFLIP,
    ProviderName.MAYACHAIN,
    ProviderName.MAYACHAIN_STREAMING,
  ];

  const chainableTokens = providersData
    .filter(({ data }) => {
      return !UNCHAINABLE_PROVIDERS.includes((data?.provider || "") as ProviderName);
    })
    .reduce(
      (acc, { data }) => (data?.tokens ? acc.concat(data.tokens) : acc),
      [] as TokensResponseV2["tokens"],
    );
  for (const { data } of providersData) {
    if (!data?.tokens) return;
    const isProviderChainable =
      data.provider && !UNCHAINABLE_PROVIDERS.includes(data.provider as ProviderName);

    for (const token of data.tokens) {
      const existingTradingPairs = tradingPairs.get(token.identifier.toLowerCase()) || {
        tokens: [],
        providers: [],
      };

      const tradingPairsForToken = isProviderChainable
        ? {
            tokens: chainableTokens,
            providers: [
              ProviderName.THORCHAIN,
              ProviderName.THORCHAIN_STREAMING,
              ProviderName.PANCAKESWAP,
              ProviderName.ONEINCH,
              ProviderName.PANGOLIN_V1,
              ProviderName.SUSHISWAP_V2,
              ProviderName.TRADERJOE_V2,
              ProviderName.UNISWAP_V3,
              ProviderName.UNISWAP_V2,
            ],
          }
        : { tokens: data.tokens, providers: data.provider };

      tradingPairs.set(token.identifier.toLowerCase(), {
        tokens: existingTradingPairs.tokens.concat(tradingPairsForToken.tokens),
        providers: existingTradingPairs.providers.concat(tradingPairsForToken.providers),
      });
    }
  }

  return tradingPairs;
}

export async function getChainflipDepositChannel({
  isDev = false,
  body,
}: {
  isDev?: boolean;
  body: BrokerDepositChannelParams;
}) {
  const { destinationAddress } = body;

  if (!destinationAddress) {
    throw new SwapKitError("chainflip_broker_invalid_params");
  }
  const url = `${getBaseUrl(isDev)}/channel`;

  const response = await RequestClient.post<DepositChannelResponse>(url, {
    json: body,
  });

  try {
    const parsedResponse = DepositChannelResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    return parsedResponse.data;
  } catch (error) {
    throw new SwapKitError("api_v2_invalid_response", error);
  }
}
