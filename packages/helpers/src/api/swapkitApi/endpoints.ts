import {
  type Chain,
  type EVMChain,
  EVMChains,
  isGasAsset,
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
  type NearDepositChannelParams,
  type NearSwapResponse,
  NearSwapResponseSchema,
  type PriceRequest,
  type PriceResponse,
  PriceResponseSchema,
  type QuoteRequest,
  type QuoteResponse,
  QuoteResponseSchema,
  type TokenListProvidersResponse,
  type TokensResponseV2,
  type TrackerResponse,
  TrackerResponseSchema,
  type TrackingRequest,
} from "./types";

const SKRequestClient = RequestClient.extend({
  dynamicHeader: () => {
    const { swapKit } = SKConfig.get("apiKeys");
    return swapKit ? { "x-api-key": swapKit } : {};
  },
});

export async function getTrackerDetails(json: TrackingRequest) {
  const response = await SKRequestClient.post<TrackerResponse>(getApiUrl("/track"), { json });

  try {
    const parsedResponse = TrackerResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    return parsedResponse.data;
  } catch (_error) {
    // throw new SwapKitError("api_v2_invalid_response", error);
    return response;
  }
}

export async function getSwapQuote(json: QuoteRequest) {
  const response = await SKRequestClient.post<QuoteResponse>(getApiUrl("/quote"), { json });

  if (response.error) {
    throw new SwapKitError("api_v2_server_error", { message: response.error });
  }

  try {
    const parsedResponse = QuoteResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    return parsedResponse.data;
  } catch (_error) {
    // throw new SwapKitError("api_v2_invalid_response", error);
    return response;
  }
}

export async function getChainBalance<T extends Chain>({
  chain,
  address,
  scamFilter = true,
}: {
  chain: T;
  address: string;
  scamFilter?: boolean;
}) {
  const url = getApiUrl(`/balance?chain=${chain}&address=${address}`);
  const balanceResponse = await SKRequestClient.get<BalanceResponse>(url);
  const balances = Array.isArray(balanceResponse) ? balanceResponse : [];

  return scamFilter ? filterAssets(balances) : balances;
}

export function getTokenListProviders() {
  const url = getApiUrl("/providers");
  return SKRequestClient.get<TokenListProvidersResponse>(url);
}

export function getTokenList(provider: ProviderName) {
  const url = getApiUrl(`/tokens?provider=${provider}`);
  return SKRequestClient.get<TokensResponseV2>(url);
}

export async function getPrice(body: PriceRequest) {
  const url = getApiUrl("/price");
  const response = await SKRequestClient.post<PriceResponse>(url, { json: body });

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
  const response = await SKRequestClient.get<GasResponse>(url);

  try {
    const parsedResponse = GasResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    const gasRates = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];
    return gasRates;
  } catch (error) {
    throw new SwapKitError("api_v2_invalid_response", error);
  }
}

export async function getChainflipDepositChannel(body: BrokerDepositChannelParams) {
  const { destinationAddress } = body;

  if (!destinationAddress) {
    throw new SwapKitError("chainflip_broker_invalid_params");
  }
  const url = SKConfig.get("integrations").chainflip?.brokerUrl || getApiUrl("/chainflip/broker/channel");

  const response = await SKRequestClient.post<DepositChannelResponse>(url, { json: body });

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

export async function getNearDepositChannel(body: NearDepositChannelParams) {
  const { destinationAddress } = body;

  if (!destinationAddress) {
    throw new SwapKitError("chainflip_broker_invalid_params");
  }
  const url = getApiUrl("/near/channel");

  const response = await SKRequestClient.post<NearSwapResponse>(url, { json: body });

  try {
    const parsedResponse = NearSwapResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    return parsedResponse.data;
  } catch (error) {
    throw new SwapKitError("api_v2_invalid_response", error);
  }
}

function getApiUrl(path?: `/${string}`) {
  const { isDev, apiUrl, devApiUrl } = SKConfig.get("envs");

  return `${isDev ? devApiUrl : apiUrl}${path}`;
}

function evmAssetHasAddress(assetString: string) {
  const [chain, symbol] = assetString.split(".") as [EVMChain, string];
  if (!EVMChains.includes(chain as EVMChain)) return true;
  const splitSymbol = symbol.split("-");
  const address = splitSymbol.length === 1 ? undefined : splitSymbol[splitSymbol.length - 1];

  return isGasAsset({ chain: chain as Chain, symbol }) || !!address;
}

const potentialScamRegex = new RegExp(/(.)\1{6}|\.ORG|\.NET|\.FINANCE|\.COM|WWW|HTTP|\\\\|\/\/|[\s$%:[\]]/, "gmi");
function filterAssets(tokens: BalanceResponse) {
  return tokens.filter((token) => {
    return !potentialScamRegex.test(token.identifier) && evmAssetHasAddress(token.identifier);
  });
}
