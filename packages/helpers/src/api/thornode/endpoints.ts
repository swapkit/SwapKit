import { AssetValue, Chain, RequestClient, SKConfig, StagenetChain } from "@swapkit/helpers";
import type {
  InboundAddressesItem,
  LastBlockItem,
  MimirData,
  NodeItem,
  RunePoolInfo,
  RunePoolProviderInfo,
  THORNodeTNSDetails,
  THORNodeType,
} from "./types";

// Create extended RequestClient for thornode with custom headers
const getThornodeRequestClient = () => {
  const apiHeaders = SKConfig.get("apiHeaders");
  return RequestClient.extend({
    headers: apiHeaders.thornode || {},
  });
};

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
  const ThornodeRequestClient = getThornodeRequestClient();
  return ThornodeRequestClient.get<LastBlockItem<T>[]>(`${baseUrl(type)}/lastblock`);
}

export function getThorchainQueue(type?: THORNodeType) {
  const ThornodeRequestClient = getThornodeRequestClient();
  return ThornodeRequestClient.get(`${baseUrl(type)}/queue`);
}

export function getNodes(type?: THORNodeType) {
  const ThornodeRequestClient = getThornodeRequestClient();
  return ThornodeRequestClient.get<NodeItem[]>(`${baseUrl(type)}/nodes`);
}

export function getMimirInfo(type?: THORNodeType) {
  const ThornodeRequestClient = getThornodeRequestClient();
  return ThornodeRequestClient.get<MimirData>(`${baseUrl(type)}/mimir`);
}

export function getInboundAddresses(type?: THORNodeType) {
  const ThornodeRequestClient = getThornodeRequestClient();
  return ThornodeRequestClient.get<InboundAddressesItem[]>(`${baseUrl(type)}/inbound_addresses`);
}

export async function getTHORNodeTNSDetails({
  type,
  name,
}: { type?: THORNodeType; name: string }): Promise<THORNodeTNSDetails> {
  try {
    const ThornodeRequestClient = getThornodeRequestClient();
    const result = await ThornodeRequestClient.get<THORNodeTNSDetails>(
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
  const ThornodeRequestClient = getThornodeRequestClient();
  return ThornodeRequestClient.get<RunePoolInfo>(`${baseUrl(type)}/runepool`);
}

export function getRunePoolProviderInfo({
  type,
  thorAddress,
}: { type?: THORNodeType; thorAddress: string }) {
  const ThornodeRequestClient = getThornodeRequestClient();
  return ThornodeRequestClient.get<RunePoolProviderInfo>(
    `${baseUrl(type)}/rune_provider/${thorAddress}`,
  );
}
