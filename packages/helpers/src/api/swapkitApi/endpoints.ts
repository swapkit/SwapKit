import { ProviderName, RequestClient, SKConfig, SwapKitError, warnOnce } from "@swapkit/helpers";

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

function getApiUrl(path?: `/${string}`) {
  const { isDev, apiUrl, devApiUrl } = SKConfig.get("envs");

  return `${isDev ? devApiUrl : apiUrl}${path}`;
}

function getAuthHeaders(hash?: string) {
  const { swapKit } = SKConfig.get("apiKeys");
  const { referer } = SKConfig.get("envs");

  return {
    ...(swapKit && !hash ? { "x-api-key": swapKit } : {}),
    ...(hash && referer ? { "x-payload-hash": hash, referer } : {}),
  };
}

export async function computeHash(
  hashParams: { method: "POST"; payload: any } | { method: "GET"; url: string },
) {
  const { createHash } = await import("crypto");
  const { swapKit } = SKConfig.get("apiKeys");
  const { referer } = SKConfig.get("envs");

  if (!(referer && swapKit)) return;

  if (!["POST", "GET"].includes(hashParams.method)) {
    throw new SwapKitError("api_v2_invalid_method_key_hash", {
      message: `Invalid method for params: ${JSON.stringify(hashParams)}`,
    });
  }

  const data =
    hashParams.method === "POST"
      ? JSON.stringify(hashParams.payload)
      : `${hashParams.url}${swapKit}`;

  return createHash("sha256").update(data, "utf8").digest("hex");
}

export async function getTrackerDetails(payload: TrackerParams) {
  const hash = await computeHash({ method: "POST", payload });

  return RequestClient.post<TrackerResponse>(getApiUrl("/track"), {
    json: payload,
    headers: getAuthHeaders(hash),
  });
}

export async function getSwapQuote(searchParams: QuoteRequest) {
  const hash = await computeHash({ method: "POST", payload: searchParams });

  const response = await RequestClient.post<QuoteResponse>(getApiUrl("/quote"), {
    json: searchParams,
    headers: getAuthHeaders(hash),
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

/**
 * @deprecated use getTokenListProviders instead
 */
export function getTokenListProvidersV2() {
  warnOnce(true, "getTokenListProvidersV2 is deprecated, use getTokenListProviders instead");
  return getTokenListProviders();
}

export async function getTokenListProviders() {
  const url = getApiUrl("/providers");
  const hash = await computeHash({ method: "GET", url });
  return RequestClient.get<TokenListProvidersResponse>(url, { headers: getAuthHeaders(hash) });
}

export async function getTokenList(provider: ProviderName) {
  const url = getApiUrl(`/tokens?provider=${provider}`);
  const hash = await computeHash({ method: "GET", url });
  return RequestClient.get<TokensResponseV2>(url, { headers: getAuthHeaders(hash) });
}

export async function getPrice(body: PriceRequest) {
  const url = getApiUrl("/price");
  const hash = await computeHash({ method: "POST", payload: body });
  const response = await RequestClient.post<PriceResponse>(url, {
    json: body,
    headers: getAuthHeaders(hash),
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

export async function getGasRate() {
  const url = getApiUrl("/gas");
  const hash = await computeHash({ method: "GET", url });
  const response = await RequestClient.get<GasResponse>(url, { headers: getAuthHeaders(hash) });

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

const UNCHAINABLE_PROVIDERS = [
  ProviderName.CAVIAR_V1,
  ProviderName.CHAINFLIP,
  ProviderName.CHAINFLIP_STREAMING,
  ProviderName.MAYACHAIN,
  ProviderName.MAYACHAIN_STREAMING,
];

const CHAINABLE_PROVIDERS = [
  ProviderName.ONEINCH,
  ProviderName.PANCAKESWAP,
  ProviderName.PANGOLIN_V1,
  ProviderName.SUSHISWAP_V2,
  ProviderName.THORCHAIN,
  ProviderName.THORCHAIN_STREAMING,
  ProviderName.TRADERJOE_V2,
  ProviderName.UNISWAP_V2,
  ProviderName.UNISWAP_V3,
];

// TODO update this once the trading pairs are supported by BE api
export async function getTokenTradingPairs(providers: ProviderName[]) {
  const tradingPairs = new Map<
    string,
    {
      tokens: TokensResponseV2["tokens"];
      providers: ProviderName[];
    }
  >();

  if (!providers.length) return tradingPairs;

  const providerRequests = providers.map(async (provider) => {
    const tokenList = await getTokenList(provider);
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
        ? { tokens: chainableTokens, providers: CHAINABLE_PROVIDERS }
        : { tokens: data.tokens, providers: data.provider };

      tradingPairs.set(token.identifier.toLowerCase(), {
        tokens: existingTradingPairs.tokens.concat(tradingPairsForToken.tokens),
        providers: existingTradingPairs.providers.concat(tradingPairsForToken.providers),
      });
    }
  }

  return tradingPairs;
}

export async function getChainflipDepositChannel(body: BrokerDepositChannelParams) {
  const { destinationAddress } = body;

  if (!destinationAddress) {
    throw new SwapKitError("chainflip_broker_invalid_params");
  }
  const url = SKConfig.get("integrations").chainflip?.brokerUrl || getApiUrl("/channel");

  const response = await RequestClient.post<DepositChannelResponse>(url, { json: body });

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
