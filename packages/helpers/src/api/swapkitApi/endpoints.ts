import {
  type Chain,
  type EVMChain,
  EVMChains,
  type ProviderName,
  RequestClient,
  SKConfig,
  SwapKitError,
  isGasAsset,
} from "@swapkit/helpers";

// Create extended RequestClient for swapkitApi with custom headers
const getSwapkitApiRequestClient = () => {
  const apiHeaders = SKConfig.get("apiHeaders");
  return RequestClient.extend({
    headers: apiHeaders.swapkitApi || {},
  });
};

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

export function getTrackerDetails(json: TrackerParams) {
  const SwapkitApiRequestClient = getSwapkitApiRequestClient();
  return SwapkitApiRequestClient.post<TrackerResponse>(getApiUrl("/track"), { json });
}

export async function getSwapQuote(json: QuoteRequest) {
  const SwapkitApiRequestClient = getSwapkitApiRequestClient();
  const response = await SwapkitApiRequestClient.post<QuoteResponse>(getApiUrl("/quote"), { json });

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

export async function getChainBalance<T extends Chain>({
  chain,
  address,
  scamFilter = true,
}: { chain: T; address: string; scamFilter?: boolean }) {
  const SwapkitApiRequestClient = getSwapkitApiRequestClient();
  const url = getApiUrl(`/balance?chain=${chain}&address=${address}`);
  const balanceResponse = await SwapkitApiRequestClient.get<BalanceResponse>(url);
  const balances = Array.isArray(balanceResponse) ? balanceResponse : [];

  return scamFilter ? filterAssets(balances) : balances;
}

export function getTokenListProviders() {
  const SwapkitApiRequestClient = getSwapkitApiRequestClient();
  const url = getApiUrl("/providers");
  return SwapkitApiRequestClient.get<TokenListProvidersResponse>(url);
}

export function getTokenList(provider: ProviderName) {
  const SwapkitApiRequestClient = getSwapkitApiRequestClient();
  const url = getApiUrl(`/tokens?provider=${provider}`);
  return SwapkitApiRequestClient.get<TokensResponseV2>(url);
}

export async function getPrice(body: PriceRequest) {
  const SwapkitApiRequestClient = getSwapkitApiRequestClient();
  const url = getApiUrl("/price");
  const response = await SwapkitApiRequestClient.post<PriceResponse>(url, {
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
  const SwapkitApiRequestClient = getSwapkitApiRequestClient();
  const url = getApiUrl("/gas");
  const response = await SwapkitApiRequestClient.get<GasResponse>(url);

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
  const SwapkitApiRequestClient = getSwapkitApiRequestClient();
  const url = SKConfig.get("integrations").chainflip?.brokerUrl || getApiUrl("/channel");

  const response = await SwapkitApiRequestClient.post<DepositChannelResponse>(url, { json: body });

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

const potentialScamRegex = new RegExp(
  /(.)\1{6}|\.ORG|\.NET|\.FINANCE|\.COM|WWW|HTTP|\\\\|\/\/|[\s$%:[\]]/,
  "gmi",
);
function filterAssets(tokens: BalanceResponse) {
  return tokens.filter((token) => {
    return !potentialScamRegex.test(token.identifier) && evmAssetHasAddress(token.identifier);
  });
}
