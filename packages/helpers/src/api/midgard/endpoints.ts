import { AssetValue, RequestClient, SwapKitNumber } from "@swapkit/helpers";
import { Chain, getChainConfig, type TCLikeChain } from "@swapkit/types";
import type {
  Action,
  ActionQuery,
  Balance,
  Constants,
  DepthHistory,
  EarningsHistory,
  HealthInfo,
  HistoryQuery,
  MemberDetailsMayachain,
  MemberDetailsThorchain,
  MimirVote,
  NetworkInfo,
  Node,
  PagedResponse,
  Pool,
  PoolStats,
  SaverDetails,
  SaversHistory,
  Stats,
  SwapHistory,
  THORNameDetails,
  TVLHistory,
} from "./types";

function getMidgardBaseUrl(isThorchain = true) {
  return isThorchain ? "https://midgard.ninerealms.com" : "https://midgard.mayachain.info";
}

function getNameServiceBaseUrl(isThorchain = true) {
  const baseUrl = getMidgardBaseUrl(isThorchain);
  return isThorchain ? `${baseUrl}/v2/thorname` : `${baseUrl}/v2/mayaname`;
}

function getPools(baseUrl: string) {
  return function getPools(status?: string): Promise<Pool[]> {
    const params = status ? `?status=${status}` : "";
    return RequestClient.get<Pool[]>(`${baseUrl}/v2/pools${params}`);
  };
}

function getPool(baseUrl: string) {
  return function getPool(asset: string): Promise<Pool> {
    return RequestClient.get<Pool>(`${baseUrl}/v2/pool/${asset}`);
  };
}

function getPoolStats(baseUrl: string) {
  return function getPoolStats(asset: string, period?: string): Promise<PoolStats> {
    const params = period ? `?period=${period}` : "";
    return RequestClient.get<PoolStats>(`${baseUrl}/v2/pool/${asset}/stats${params}`);
  };
}

function getPoolDepthHistory(baseUrl: string) {
  return function getPoolDepthHistory(asset: string, query?: HistoryQuery): Promise<DepthHistory> {
    const params = new URLSearchParams();
    if (query?.interval) params.append("interval", query.interval);
    if (query?.count) params.append("count", query.count.toString());
    if (query?.from) params.append("from", query.from.toString());
    if (query?.to) params.append("to", query.to.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return RequestClient.get<DepthHistory>(`${baseUrl}/v2/history/depths/${asset}${queryString}`);
  };
}

function getNetworkInfo(baseUrl: string) {
  return function getNetworkInfo(): Promise<NetworkInfo> {
    return RequestClient.get<NetworkInfo>(`${baseUrl}/v2/network`);
  };
}

function getHealth(baseUrl: string) {
  return function getHealth(): Promise<HealthInfo> {
    return RequestClient.get<HealthInfo>(`${baseUrl}/v2/health`);
  };
}

function getNodes(baseUrl: string) {
  return function getNodes(): Promise<Node[]> {
    return RequestClient.get<Node[]>(`${baseUrl}/v2/nodes`);
  };
}

function getNode(baseUrl: string) {
  return function getNode(address: string): Promise<Node> {
    return RequestClient.get<Node>(`${baseUrl}/v2/node/${address}`);
  };
}

function getMimirVotes(baseUrl: string) {
  return function getMimirVotes(): Promise<MimirVote[]> {
    return RequestClient.get<MimirVote[]>(`${baseUrl}/v2/mimir/votes`);
  };
}

function getMimir(baseUrl: string) {
  return function getMimir(): Promise<Record<string, string>> {
    return RequestClient.get<Record<string, string>>(`${baseUrl}/v2/mimir`);
  };
}

function getConstants(baseUrl: string) {
  return function getConstants(): Promise<Constants> {
    return RequestClient.get<Constants>(`${baseUrl}/v2/constants`);
  };
}

function getStats(baseUrl: string) {
  return function getStats(): Promise<Stats> {
    return RequestClient.get<Stats>(`${baseUrl}/v2/stats`);
  };
}

function getEarningsHistory(baseUrl: string) {
  return function getEarningsHistory(query?: HistoryQuery): Promise<EarningsHistory> {
    const params = new URLSearchParams();
    if (query?.interval) params.append("interval", query.interval);
    if (query?.count) params.append("count", query.count.toString());
    if (query?.from) params.append("from", query.from.toString());
    if (query?.to) params.append("to", query.to.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return RequestClient.get<EarningsHistory>(`${baseUrl}/v2/history/earnings${queryString}`);
  };
}

function getSwapHistory(baseUrl: string) {
  return function getSwapHistory(pool?: string, query?: HistoryQuery): Promise<SwapHistory> {
    const params = new URLSearchParams();
    if (query?.interval) params.append("interval", query.interval);
    if (query?.count) params.append("count", query.count.toString());
    if (query?.from) params.append("from", query.from.toString());
    if (query?.to) params.append("to", query.to.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const poolPath = pool ? `/swaps/${pool}` : "/swaps";
    return RequestClient.get<SwapHistory>(`${baseUrl}/v2/history${poolPath}${queryString}`);
  };
}

function getTVLHistory(baseUrl: string) {
  return function getTVLHistory(query?: HistoryQuery): Promise<TVLHistory> {
    const params = new URLSearchParams();
    if (query?.interval) params.append("interval", query.interval);
    if (query?.count) params.append("count", query.count.toString());
    if (query?.from) params.append("from", query.from.toString());
    if (query?.to) params.append("to", query.to.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return RequestClient.get<TVLHistory>(`${baseUrl}/v2/history/tvl${queryString}`);
  };
}

function buildActionParams(query?: ActionQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  const appendParam = (key: keyof ActionQuery, value: any) => {
    if (value !== undefined) {
      params.append(key, typeof value === "number" ? value.toString() : value);
    }
  };
  appendParam("address", query.address);
  appendParam("txid", query.txid);
  appendParam("asset", query.asset);
  appendParam("type", query.type);
  appendParam("affiliate", query.affiliate);
  appendParam("limit", query.limit);
  appendParam("offset", query.offset);
  return params.toString() ? `?${params.toString()}` : "";
}

function getActions(baseUrl: string) {
  return function getActions(query?: ActionQuery): Promise<PagedResponse<Action>> {
    const queryString = buildActionParams(query);
    return RequestClient.get<PagedResponse<Action>>(`${baseUrl}/v2/actions${queryString}`);
  };
}

function getLiquidityPositionRaw<Chain extends TCLikeChain>(baseUrl: string) {
  return function getLiquidityPosition(
    address: string,
  ): Promise<Chain extends typeof Chain.THORChain ? MemberDetailsThorchain : MemberDetailsMayachain> {
    return RequestClient.get<Chain extends typeof Chain.THORChain ? MemberDetailsThorchain : MemberDetailsMayachain>(
      `${baseUrl}/v2/member/${address}`,
    );
  };
}

function getMembers(baseUrl: string) {
  return function getMembers(pool?: string): Promise<string[]> {
    const poolPath = pool ? `/${pool}` : "";
    return RequestClient.get<string[]>(`${baseUrl}/v2/members${poolPath}`);
  };
}

function getSaverDetails(baseUrl: string) {
  return function getSaverDetails(address: string, pool?: string): Promise<SaverDetails[]> {
    const poolPath = pool ? `&asset=${pool}` : "";
    return RequestClient.get<SaverDetails[]>(
      `${baseUrl}/v2/saver/${address}${poolPath ? `?${poolPath.substring(1)}` : ""}`,
    );
  };
}

function getSavers(baseUrl: string) {
  return function getSavers(pool: string): Promise<string[]> {
    return RequestClient.get<string[]>(`${baseUrl}/v2/savers/${pool}`);
  };
}

function getSaversHistory(baseUrl: string) {
  return function getSaversHistory(pool?: string, query?: HistoryQuery): Promise<SaversHistory> {
    const params = new URLSearchParams();
    if (query?.interval) params.append("interval", query.interval);
    if (query?.count) params.append("count", query.count.toString());
    if (query?.from) params.append("from", query.from.toString());
    if (query?.to) params.append("to", query.to.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const poolPath = pool ? `/savers/${pool}` : "/savers";
    return RequestClient.get<SaversHistory>(`${baseUrl}/v2/history${poolPath}${queryString}`);
  };
}

function getBalance(baseUrl: string) {
  return function getBalance(address: string): Promise<Balance[]> {
    return RequestClient.get<Balance[]>(`${baseUrl}/v2/balance/${address}`);
  };
}

function getNameDetails(baseUrl: string) {
  return async function getNamesByAddress(name: string) {
    const errorHandler = (error: any) => {
      // Handle specific error cases
      if (error?.cause?.status === 404) {
        return undefined;
      }
      throw error;
    };
    return await RequestClient.get<THORNameDetails>(`${baseUrl}/lookup/${name}`, {
      onError: errorHandler,
      retry: { maxRetries: 1 },
    });
  };
}

function getNamesByAddress(baseUrl: string) {
  return async function getNamesByAddress(address: string) {
    const errorHandler = (error: any) => {
      // Handle specific error cases
      if (error?.cause?.status === 404) {
        return [];
      }
      throw error;
    };
    return await RequestClient.get<string[]>(`${baseUrl}/rlookup/${address}`, {
      onError: errorHandler,
      retry: { maxRetries: 1 },
    });
  };
}

function getNamesByOwner(baseUrl: string) {
  return async function getNamesByOwner(address: string) {
    const errorHandler = (error: any) => {
      // Handle specific error cases
      if (error?.cause?.status === 404) {
        return [];
      }
      throw error;
    };
    return await RequestClient.get<string[]>(`${baseUrl}/owner/${address}`, {
      onError: errorHandler,
      retry: { maxRetries: 1 },
    });
  };
}

function getPoolAsset({ asset, value }: { asset: string; value: string }) {
  return AssetValue.from({ asset, fromBaseDecimal: getChainConfig(Chain.THORChain).baseDecimal, value });
}

function getLiquidityPosition<IsThorchain extends boolean = true>({
  liquidityPositionGetter,
  isThorchain,
}: {
  liquidityPositionGetter: ReturnType<
    typeof getLiquidityPositionRaw<IsThorchain extends true ? typeof Chain.THORChain : typeof Chain.Maya>
  >;
  isThorchain: IsThorchain;
}) {
  return async function getLiquidityPosition(address: string) {
    const rawLiquidityPositions = await liquidityPositionGetter(address);
    const fieldPrefix = isThorchain ? "rune" : "cacao";

    return rawLiquidityPositions.pools.map((p) => ({
      [`${fieldPrefix}Pending`]: getPoolAsset({ asset: "THOR.RUNE", value: p.runePending }),
      [`${fieldPrefix}RegisteredAddress`]: p.runeAddress,
      [`${fieldPrefix}Withdrawn`]: getPoolAsset({ asset: "THOR.RUNE", value: p.runeWithdrawn }),
      [fieldPrefix]: getPoolAsset({ asset: "THOR.RUNE", value: p.runeAdded }),
      asset: getPoolAsset({ asset: p.pool, value: p.assetAdded }),
      assetPending: getPoolAsset({ asset: p.pool, value: p.assetPending }),
      assetRegisteredAddress: p.assetAddress,
      assetWithdrawn: getPoolAsset({ asset: p.pool, value: p.assetWithdrawn }),
      dateFirstAdded: p.dateFirstAdded,
      dateLastAdded: p.dateLastAdded,
      poolShare: new SwapKitNumber(p.liquidityUnits).div(p.pool),
    }));
  };
}

function getMidgardMethodsForProtocol<T extends TCLikeChain>(chain: T) {
  const isThorchain = chain === Chain.THORChain;
  const midgardBaseUrl = getMidgardBaseUrl(isThorchain);
  const nameServiceBaseUrl = getNameServiceBaseUrl(isThorchain);
  const liquidityPositionGetter = getLiquidityPositionRaw<T>(midgardBaseUrl);

  return {
    getActions: getActions(midgardBaseUrl),
    getBalance: getBalance(midgardBaseUrl),
    getConstants: getConstants(midgardBaseUrl),
    getEarningsHistory: getEarningsHistory(midgardBaseUrl),
    getHealth: getHealth(midgardBaseUrl),
    getLiquidityPosition: getLiquidityPosition({ isThorchain, liquidityPositionGetter }),
    getLiquidityPositionRaw: liquidityPositionGetter,
    getMembers: getMembers(midgardBaseUrl),
    getMimir: getMimir(midgardBaseUrl),
    getMimirVotes: getMimirVotes(midgardBaseUrl),
    getNameDetails: getNameDetails(nameServiceBaseUrl),
    getNamesByAddress: getNamesByAddress(nameServiceBaseUrl),
    getNamesByOwner: getNamesByOwner(nameServiceBaseUrl),
    getNetworkInfo: getNetworkInfo(midgardBaseUrl),
    getNode: getNode(midgardBaseUrl),
    getNodes: getNodes(midgardBaseUrl),
    getPool: getPool(midgardBaseUrl),
    getPoolDepthHistory: getPoolDepthHistory(midgardBaseUrl),
    getPoolStats: getPoolStats(midgardBaseUrl),
    getPools: getPools(midgardBaseUrl),
    getSaverDetails: getSaverDetails(midgardBaseUrl),
    getSavers: getSavers(midgardBaseUrl),
    getSaversHistory: getSaversHistory(midgardBaseUrl),
    getStats: getStats(midgardBaseUrl),
    getSwapHistory: getSwapHistory(midgardBaseUrl),
    getTVLHistory: getTVLHistory(midgardBaseUrl),
  };
}

export const thorchainMidgard = getMidgardMethodsForProtocol(Chain.THORChain);
export const mayachainMidgard = getMidgardMethodsForProtocol(Chain.Maya);
