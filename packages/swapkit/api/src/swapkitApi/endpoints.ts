import crypto from "crypto";
import { ProviderName, RequestClient, SwapKitError } from "@swapkit/helpers";
import {
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

export const computeHash = ({
  method,
  url,
  apiKey,
  payload,
}: {
  method: string;
  url: string;
  apiKey: string;
  payload: any;
}): string => {
  switch (method) {
    case "POST":
      return computeHashForPost({ payload, apiKey });
    case "GET":
      return computeHashForGet({ url, apiKey });
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
  const hash = apiKey
    ? computeHash({
        method: "POST",
        apiKey: apiKey ?? "",
        url,
        payload,
      })
    : undefined;
  return RequestClient.post<TrackerResponse>(url, {
    json: payload,
    headers: {
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      ...(hash ? { "x-payload-hash": hash } : {}),
      ...(referer ? { referer } : {}),
    },
  });
}

export async function getSwapQuoteV2<T extends boolean>(
  searchParams: QuoteRequest,
  isDev?: T,
  apiKey?: string,
  referer?: string,
) {
  const url = `${getBaseUrl(isDev)}/quote`;
  const hash = apiKey
    ? computeHash({
        method: "POST",
        apiKey: apiKey ?? "",
        url,
        payload: searchParams,
      })
    : undefined;
  const response = await RequestClient.post<QuoteResponse>(url, {
    json: searchParams,
    headers: {
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      ...(hash ? { "x-payload-hash": hash } : {}),
      ...(referer ? { referer } : {}),
    },
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
  const hash = apiKey
    ? computeHash({
        method: "GET",
        apiKey: apiKey ?? "",
        url,
        payload: undefined,
      })
    : undefined;
  return RequestClient.get<TokenListProvidersResponse>(url, {
    headers: {
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      ...(hash ? { "x-payload-hash": hash } : {}),
      ...(referer ? { referer } : {}),
    },
  });
}

export function getTokenListV2(
  provider: ProviderName,
  isDev = false,
  apiKey?: string,
  referer?: string,
) {
  const url = `${getBaseUrl(isDev)}/tokens?provider=${provider}`;
  const hash = apiKey
    ? computeHash({
        method: "GET",
        apiKey: apiKey ?? "",
        url,
        payload: undefined,
      })
    : undefined;
  return RequestClient.get<TokensResponseV2>(url, {
    headers: {
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      ...(hash ? { "x-payload-hash": hash } : {}),
      ...(referer ? { referer } : {}),
    },
  });
}

export async function getPrice(
  body: PriceRequest,
  isDev = false,
  apiKey?: string,
  referer?: string,
) {
  const url = `${getBaseUrl(isDev)}/price`;
  const hash = apiKey
    ? computeHash({
        method: "POST",
        apiKey: apiKey ?? "",
        url,
        payload: body,
      })
    : undefined;
  const response = await RequestClient.post<PriceResponse>(url, {
    json: body,
    headers: {
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      ...(referer ? { referer } : {}),
      ...(hash ? { "x-payload-hash": hash } : {}),
    },
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
