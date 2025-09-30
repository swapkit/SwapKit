import { AssetValue, RequestClient, SKConfig } from "@swapkit/helpers";
import { MAYAConfig, StagenetMAYAConfig, StagenetTHORConfig, THORConfig } from "@swapkit/types";
import type {
  InboundAddressesItem,
  LastBlockItem,
  MimirData,
  NodeItem,
  RunePoolInfo,
  RunePoolProviderInfo,
  TCYClaimerResponse,
  TCYClaimersResponse,
  TCYStakerResponse,
  TCYStakersResponse,
  THORNodeTNSDetails,
  THORNodeType,
} from "./types";

function baseUrl(type?: THORNodeType) {
  const { isStagenet } = SKConfig.get("envs");

  switch (type) {
    case "mayachain": {
      const nodeUrl = isStagenet ? StagenetMAYAConfig.nodeUrl : MAYAConfig.nodeUrl;
      return `${nodeUrl}/mayachain`;
    }
    default: {
      const nodeUrl = isStagenet ? StagenetTHORConfig.nodeUrl : THORConfig.nodeUrl;

      return `${nodeUrl}/thorchain`;
    }
  }
}

function getNameServiceBaseUrl(type?: THORNodeType) {
  const nsType = type === "mayachain" ? "mayaname" : "thorname";

  return `${baseUrl(type)}/${nsType}`;
}

export function getLastBlock<T extends THORNodeType = "thorchain">(type: T = "thorchain" as T) {
  return RequestClient.get<LastBlockItem<T>[]>(`${baseUrl(type)}/lastblock`);
}

export function getThorchainQueue(type?: THORNodeType) {
  return RequestClient.get(`${baseUrl(type)}/queue`);
}

export function getNodes(type?: THORNodeType) {
  return RequestClient.get<NodeItem[]>(`${baseUrl(type)}/nodes`);
}

export function getMimirInfo(type?: THORNodeType) {
  return RequestClient.get<MimirData>(`${baseUrl(type)}/mimir`);
}

export function getInboundAddresses(type?: THORNodeType) {
  return RequestClient.get<InboundAddressesItem[]>(`${baseUrl(type)}/inbound_addresses`);
}

export async function getTHORNodeTNSDetails({
  type,
  name,
}: {
  type?: THORNodeType;
  name: string;
}): Promise<THORNodeTNSDetails> {
  try {
    const result = await RequestClient.get<THORNodeTNSDetails>(`${getNameServiceBaseUrl(type)}/${name}`);
    return result;
  } catch {
    return { affiliate_collector_rune: "", aliases: [], expire_block_height: 0, name, owner: "", preferred_asset: "" };
  }
}

export async function getTNSPreferredAsset({ type, tns }: { type?: THORNodeType; tns: string }) {
  const tnsDetails = await getTHORNodeTNSDetails({ name: tns, type });

  if (!tnsDetails.preferred_asset || tnsDetails.preferred_asset === ".") return undefined;

  return AssetValue.from({ asset: tnsDetails.preferred_asset, asyncTokenLookup: true });
}

export function getRunePoolInfo(type?: THORNodeType) {
  return RequestClient.get<RunePoolInfo>(`${baseUrl(type)}/runepool`);
}

export function getRunePoolProviderInfo({ type, thorAddress }: { type?: THORNodeType; thorAddress: string }) {
  return RequestClient.get<RunePoolProviderInfo>(`${baseUrl(type)}/rune_provider/${thorAddress}`);
}

export function getTcyStaker({ type, address }: { type?: THORNodeType; address: string }) {
  return RequestClient.get<TCYStakerResponse>(`${baseUrl(type)}/tcy_staker/${address}`);
}

export function getTcyStakers(type?: THORNodeType) {
  return RequestClient.get<TCYStakersResponse>(`${baseUrl(type)}/tcy_stakers`);
}

export function getTcyClaimer({ type, address }: { type?: THORNodeType; address: string }) {
  return RequestClient.get<TCYClaimerResponse>(`${baseUrl(type)}/tcy_claimer/${address}`);
}

export function getTcyClaimers(type?: THORNodeType) {
  return RequestClient.get<TCYClaimersResponse>(`${baseUrl(type)}/tcy_claimers`);
}
