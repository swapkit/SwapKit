import {
  AssetValue,
  type Chain,
  type EVMChain,
  EVMChains,
  isGasAsset,
  type ProviderName,
  RequestClient,
  SKConfig,
  SwapKitError,
} from "@swapkit/helpers";
import { match, P } from "ts-pattern";
import {
  type ApproveResponse,
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
  type QuoteResponseRoute,
  QuoteResponseRouteItem,
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
  const { getQuote } = SKConfig.get("endpoints");

  if (getQuote) return getQuote(json);

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
  } catch {
    // throw new SwapKitError("api_v2_invalid_response", error);
    return response;
  }
}

export async function getRouteWithTx(json: { routeId: string; sourceAddress: string; destinationAddress: string }) {
  const { getRouteWithTx } = SKConfig.get("endpoints");

  if (getRouteWithTx) return getRouteWithTx(json);

  const response = await SKRequestClient.post<QuoteResponseRoute>(getApiUrl("/swap"), { json });

  try {
    const parsedResponse = QuoteResponseRouteItem.safeParse(response);

    if (!parsedResponse.success) {
      throw new SwapKitError("api_v2_invalid_response", parsedResponse.error);
    }

    return parsedResponse.data;
  } catch (error) {
    console.error(new SwapKitError("api_v2_invalid_response", error));
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
  const { getBalance } = SKConfig.get("endpoints");
  if (getBalance) return getBalance({ address, chain });

  const url = getApiUrl(`/balance?chain=${chain}&address=${address}`);
  const balanceResponse = await SKRequestClient.get<BalanceResponse>(url);
  const balances = Array.isArray(balanceResponse) ? balanceResponse : [];
  return scamFilter ? filterAssets(balances) : balances;
}

export function getTokenApproval(
  params: { spender: string; userWallet: string; assetValue: AssetValue } | { routeId: string; spender: string },
) {
  return match(params)
    .with({ routeId: P.string, spender: P.string }, ({ routeId, spender }) => {
      const url = getApiUrl(`/approve?routeId=${routeId}&sourceAddress=${spender}`);
      return SKRequestClient.get<ApproveResponse>(url);
    })
    .with(
      { assetValue: P.instanceOf(AssetValue), spender: P.string, userWallet: P.string },
      ({ spender, userWallet, assetValue }) => {
        const url = getApiUrl(
          `/approve?tokenIdentifier=${assetValue.toString()}&userWalletAddress=${userWallet}&spender=${spender}&amount=${assetValue.getValue("string")}`,
        );
        return SKRequestClient.get<ApproveResponse>(url);
      },
    )
    .exhaustive();
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
  const { isDev, apiUrl, devApiUrl, experimental_apiUrlQuote, experimental_apiUrlSwap } = SKConfig.get("envs");

  const defaultUrl = `${isDev ? devApiUrl : apiUrl}${path}`;

  return match({ experimental_apiUrlQuote, experimental_apiUrlSwap, path })
    .with(
      { experimental_apiUrlQuote: P.string.startsWith("http"), path: "/quote" },
      ({ experimental_apiUrlQuote, path }) => `${experimental_apiUrlQuote}${path}`,
    )
    .with(
      { experimental_apiUrlSwap: P.string.startsWith("http"), path: "/swap" },
      ({ experimental_apiUrlSwap, path }) => `${experimental_apiUrlSwap}${path}`,
    )
    .otherwise(() => defaultUrl);
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
