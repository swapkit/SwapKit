import { AssetValue, Chain, RequestClient, SKConfig, StagenetChain } from "@swapkit/helpers";
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
  const nodeUrls = SKConfig.get("nodeUrls");

  switch (type) {
    case "mayachain": {
      const mayaNodeUrl = nodeUrls[isStagenet ? StagenetChain.Maya : Chain.Maya];

      return `${mayaNodeUrl}/mayachain`;
    }
    default: {
      const thorNodeUrl = nodeUrls[isStagenet ? StagenetChain.THORChain : Chain.THORChain];

      return `${thorNodeUrl}/thorchain`;
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
}: { type?: THORNodeType; name: string }): Promise<THORNodeTNSDetails> {
  try {
    const result = await RequestClient.get<THORNodeTNSDetails>(
      `${getNameServiceBaseUrl(type)}/${name}`,
    );
    return result;
  } catch (_error) {
    // If we get an error, the name doesn't exist and is available for registration
    return {
      name,
      expire_block_height: 0,
      owner: "",
      preferred_asset: "",
      affiliate_collector_rune: "",
      aliases: [],
    };
  }
}

export async function getTNSPreferredAsset({ type, tns }: { type?: THORNodeType; tns: string }) {
  const tnsDetails = await getTHORNodeTNSDetails({ name: tns, type });

  if (!tnsDetails.preferred_asset || tnsDetails.preferred_asset === ".") return undefined;

  return AssetValue.from({ asyncTokenLookup: true, asset: tnsDetails.preferred_asset });
}

export function getRunePoolInfo(type?: THORNodeType) {
  return RequestClient.get<RunePoolInfo>(`${baseUrl(type)}/runepool`);
}

export function getRunePoolProviderInfo({
  type,
  thorAddress,
}: { type?: THORNodeType; thorAddress: string }) {
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
