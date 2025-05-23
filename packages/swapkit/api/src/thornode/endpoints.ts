import { AssetValue, RequestClient } from "@swapkit/helpers";
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
  ThornodeEndpointParams,
} from "./types";

function baseUrl({ type = "thorchain", stagenet = false }: ThornodeEndpointParams = {}) {
  switch (type) {
    case "mayachain":
      return stagenet
        ? "https://stagenet.mayanode.mayachain.info/mayachain"
        : "https://mayanode.mayachain.info/mayachain";
    default:
      return stagenet
        ? "https://stagenet-thornode.ninerealms.com/thorchain"
        : "https://thornode.ninerealms.com/thorchain";
  }
}

function getNameServiceBaseUrl({
  type = "thorchain",
  stagenet = false,
}: ThornodeEndpointParams = {}) {
  const nsType = type === "mayachain" ? "mayaname" : "thorname";

  return `${baseUrl({ type, stagenet })}/${nsType}`;
}

export function getLastBlock(params?: ThornodeEndpointParams) {
  return RequestClient.get<LastBlockItem[]>(`${baseUrl(params)}/lastblock`);
}

export function getThorchainQueue(params?: ThornodeEndpointParams) {
  return RequestClient.get(`${baseUrl(params)}/queue`);
}

export function getNodes(params?: ThornodeEndpointParams) {
  return RequestClient.get<NodeItem[]>(`${baseUrl(params)}/nodes`);
}

export function getMimirInfo(params?: ThornodeEndpointParams) {
  return RequestClient.get<MimirData>(`${baseUrl(params)}/mimir`);
}

export function getInboundAddresses(params?: ThornodeEndpointParams) {
  return RequestClient.get<InboundAddressesItem[]>(`${baseUrl(params)}/inbound_addresses`);
}

export function getTHORNodeTNSDetails(params: ThornodeEndpointParams & { name: string }) {
  return RequestClient.get<THORNodeTNSDetails>(`${getNameServiceBaseUrl(params)}/${params.name}`);
}

export async function getTNSPreferredAsset(tns: string) {
  const tnsDetails = await getTHORNodeTNSDetails({ name: tns });

  if (!tnsDetails.preferred_asset || tnsDetails.preferred_asset === ".") return undefined;

  return AssetValue.from({ asyncTokenLookup: true, asset: tnsDetails.preferred_asset });
}

export function getRunePoolInfo(params?: ThornodeEndpointParams) {
  return RequestClient.get<RunePoolInfo>(`${baseUrl(params)}/runepool`);
}

export function getRunePoolProviderInfo(params: ThornodeEndpointParams & { thorAddress: string }) {
  return RequestClient.get<RunePoolProviderInfo>(
    `${baseUrl(params)}/rune_provider/${params.thorAddress}`,
  );
}

export function getTcyStaker(params: ThornodeEndpointParams & { address: string }) {
  return RequestClient.get<TCYStakerResponse>(`${baseUrl(params)}/tcy_staker/${params.address}`);
}

export function getTcyStakers(params?: ThornodeEndpointParams) {
  return RequestClient.get<TCYStakersResponse>(`${baseUrl(params)}/tcy_stakers`);
}

export function getTcyClaimer(params: ThornodeEndpointParams & { address: string }) {
  return RequestClient.get<TCYClaimerResponse>(`${baseUrl(params)}/tcy_claimer/${params.address}`);
}

export function getTcyClaimers(params?: ThornodeEndpointParams) {
  return RequestClient.get<TCYClaimersResponse>(`${baseUrl(params)}/tcy_claimers`);
}
