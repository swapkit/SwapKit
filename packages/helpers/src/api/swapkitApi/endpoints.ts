import {
  type Chain,
  type ProviderName,
  RequestClient,
  SKConfig,
  SwapKitError,
} from "@swapkit/helpers";

import {
  type BalanceResponse,
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

export function getTrackerDetails(json: TrackerParams) {
  return RequestClient.post<TrackerResponse>(getApiUrl("/track"), { json });
}

export async function getSwapQuote(json: QuoteRequest) {
  const response = await RequestClient.post<QuoteResponse>(getApiUrl("/quote"), { json });

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

export function getChainBalance<T extends Chain>({
  chain,
  address,
}: { chain: T; address: string }) {
  const url = getApiUrl(`/balance?chain=${chain}&address=${address}`);
  return RequestClient.get<BalanceResponse>(url);
}

export function getTokenListProviders() {
  const url = getApiUrl("/providers");
  return RequestClient.get<TokenListProvidersResponse>(url);
}

export function getTokenList(provider: ProviderName) {
  const url = getApiUrl(`/tokens?provider=${provider}`);
  return RequestClient.get<TokensResponseV2>(url);
}

export async function getPrice(body: PriceRequest) {
  const url = getApiUrl("/price");
  const response = await RequestClient.post<PriceResponse>(url, {
    json: body,
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
  const response = await RequestClient.get<GasResponse>(url);

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
