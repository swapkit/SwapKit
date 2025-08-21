import type { TokenNames } from "@swapkit/tokens";
import { match } from "ts-pattern";

import { AssetValue } from "../modules/assetValue";
import { RequestClient } from "../modules/requestClient";
import { BaseDecimal, Chain, type EVMChain, EVMChains, UTXOChains } from "../types/chains";
import type { RadixCoreStateResourceDTO } from "../types/radix";
import { getRPCUrl } from "./chains";

export type CommonAssetString = (typeof CommonAssetStrings)[number] | Chain;

export type ConditionalAssetValueReturn<T extends boolean> = T extends true
  ? Promise<AssetValue[]>
  : AssetValue[];

export const CommonAssetStrings = [
  `${Chain.Maya}.MAYA`,
  `${Chain.Maya}.CACAO`,
  `${Chain.Ethereum}.THOR`,
  `${Chain.Ethereum}.vTHOR`,
  `${Chain.Kujira}.USK`,
  `${Chain.Ethereum}.FLIP`,
  `${Chain.Radix}.XRD`,
] as const;

const ethGasChains = [
  Chain.Arbitrum,
  Chain.Aurora,
  Chain.Base,
  Chain.Ethereum,
  Chain.Optimism,
] as const;

async function getContractDecimals({ chain, to }: { chain: EVMChain; to: string }) {
  const getDecimalMethodHex = "0x313ce567";

  try {
    const rpcUrl = await getRPCUrl(chain);

    const { result } = await RequestClient.post<{ result: string }>(rpcUrl, {
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        "cache-control": "no-cache",
      },
      body: JSON.stringify({
        id: 44,
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: to.toLowerCase(), data: getDecimalMethodHex }, "latest"],
      }),
    });

    return Number.parseInt(BigInt(result || BaseDecimal[chain]).toString());
  } catch (error) {
    console.error(`Failed to fetch contract decimals for ${to} on ${chain}:`, error);
    return BaseDecimal[chain];
  }
}

async function getRadixAssetDecimal(symbol: string) {
  if (symbol === Chain.Radix) return BaseDecimal.XRD;

  try {
    const resourceAddress = symbol.split("-")[1]?.toLowerCase();
    const rpcUrl = await getRPCUrl(Chain.Radix);

    const { manager } = await RequestClient.post<RadixCoreStateResourceDTO>(
      `${rpcUrl}/state/resource`,
      {
        headers: { Accept: "*/*", "Content-Type": "application/json" },
        body: JSON.stringify({
          network: "mainnet",
          resource_address: resourceAddress,
        }),
      },
    );

    return manager.divisibility.value.divisibility;
  } catch (error) {
    console.error(`Failed to fetch Radix asset decimal for ${symbol}:`, error);
    return BaseDecimal[Chain.Radix];
  }
}

async function getEVMAssetDecimal({ chain, symbol }: { chain: EVMChain; symbol: string }) {
  if (EVMChains.includes(symbol as EVMChain)) return BaseDecimal[symbol as EVMChain];

  const splitSymbol = symbol.split("-");
  const address =
    splitSymbol.length === 1 ? undefined : splitSymbol[splitSymbol.length - 1]?.toLowerCase();

  const decimal = await (address?.startsWith("0x")
    ? getContractDecimals({ chain, to: address })
    : BaseDecimal[chain as EVMChain]);

  return decimal;
}

export function getDecimal({ chain, symbol }: { chain: Chain; symbol: string }) {
  return match(chain)
    .with(...EVMChains, (chain) => getEVMAssetDecimal({ chain, symbol }))
    .with(Chain.Radix, () => getRadixAssetDecimal(symbol))
    .otherwise(() => BaseDecimal[chain]);
}

/**
 * @deprecated Use AssetValue.from({ chain }) instead
 */
export function getGasAsset({ chain }: { chain: Chain }) {
  return AssetValue.from({ chain });
}

export function isGasAsset({ chain, symbol }: { chain: Chain; symbol: string }) {
  return match(chain)
    .with(...ethGasChains, () => symbol === "ETH")
    .with(Chain.Avalanche, () => symbol === "AVAX")
    .with(Chain.Berachain, () => symbol === "BERA")
    .with(Chain.BinanceSmartChain, () => symbol === "BNB")
    .with(Chain.Gnosis, () => symbol === "XDAI")
    .with(Chain.Maya, () => symbol === "CACAO")
    .with(Chain.Cosmos, () => symbol === "ATOM")
    .with(Chain.THORChain, () => symbol === "RUNE")
    .with(Chain.Tron, () => symbol === "TRX")
    .with(Chain.Radix, () => `${chain}.${symbol}` === getCommonAssetInfo(chain).identifier)
    .otherwise(() => symbol === chain);
}

export const getCommonAssetInfo = (assetString: CommonAssetString) => {
  const decimal = BaseDecimal[assetString as Chain];

  const commonAssetInfo = match(assetString.toUpperCase())
    .with(...ethGasChains, (asset) => ({ identifier: `${asset}.ETH`, decimal }))
    .with(Chain.THORChain, (asset) => ({ identifier: `${asset}.RUNE`, decimal }))
    .with(Chain.Cosmos, (asset) => ({ identifier: `${asset}.ATOM`, decimal }))
    .with(Chain.Maya, (asset) => ({ identifier: `${asset}.CACAO`, decimal: 10 }))
    .with(Chain.BinanceSmartChain, (asset) => ({ identifier: `${asset}.BNB`, decimal }))
    .with(Chain.Avalanche, (asset) => ({ identifier: `${asset}.AVAX`, decimal }))
    .with(Chain.Gnosis, (asset) => ({ identifier: `${asset}.XDAI`, decimal }))
    .with(Chain.Berachain, (asset) => ({ identifier: `${asset}.BERA`, decimal }))
    .with(Chain.Tron, (asset) => ({ identifier: `${asset}.TRX`, decimal }))
    .with(
      ...UTXOChains,
      Chain.Solana,
      Chain.Chainflip,
      Chain.Kujira,
      Chain.Ripple,
      Chain.Polkadot,
      Chain.Near,
      (asset) => ({ identifier: `${asset}.${asset}`, decimal }),
    )
    .with(Chain.Radix, "XRD.XRD", () => ({ identifier: "XRD.XRD", decimal }))
    .with(Chain.Polygon, "POL.POL", () => ({ identifier: "POL.POL", decimal }))
    .with("KUJI.USK", (asset) => ({ identifier: asset, decimal: 6 }))
    .with("ETH.FLIP", () => ({
      identifier: "ETH.FLIP-0x826180541412D574cf1336d22c0C0a287822678A",
      decimal: BaseDecimal.ETH,
    }))
    .with("ETH.THOR", () => ({
      identifier: "ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
      decimal: BaseDecimal.ETH,
    }))
    .with("ETH.vTHOR", () => ({
      identifier: "ETH.vTHOR-0x815c23eca83261b6ec689b60cc4a58b54bc24d8d",
      decimal: BaseDecimal.ETH,
    }))
    .with("MAYA.CACAO", (identifier) => ({ identifier, decimal: 10 }))
    .with("MAYA.MAYA", (identifier) => ({ identifier, decimal: 4 }))
    // Just to be sure that we are not missing any chain
    .otherwise(() => ({ identifier: assetString, decimal }));

  return commonAssetInfo;
};

export function getAssetType({ chain, symbol }: { chain: Chain; symbol: string }) {
  if (symbol.includes("/")) return "Synth";
  if (symbol.includes("~")) return "Trade";

  const isNative = match(chain)
    .with(
      Chain.Radix,
      () => symbol === Chain.Radix || `${chain}.${symbol}` === getCommonAssetInfo(chain).identifier,
    )
    .with(Chain.Arbitrum, Chain.Optimism, Chain.Base, Chain.Aurora, () => symbol === Chain.Ethereum)
    .with(Chain.Cosmos, () => symbol === "ATOM")
    .with(Chain.BinanceSmartChain, () => symbol === "BNB")
    .with(Chain.Maya, () => symbol === "CACAO")
    .with(Chain.THORChain, () => symbol === "RUNE")
    .with(Chain.Tron, () => symbol === "TRX")
    .otherwise(() => symbol === chain);

  return isNative ? "Native" : chain;
}

export const assetFromString = (assetString: string) => {
  const [chain, ...symbolArray] = assetString.split(".") as [Chain, ...(string | undefined)[]];
  const synth = assetString.includes("/");
  const symbol = symbolArray.join(".");
  const splitSymbol = symbol?.split("-");
  const ticker = splitSymbol?.length
    ? splitSymbol.length === 1
      ? splitSymbol[0]
      : splitSymbol.slice(0, -1).join("-")
    : undefined;

  return { chain, symbol, ticker, synth };
};

export async function findAssetBy(
  params:
    | { chain: EVMChain | Chain.Near | Chain.Radix | Chain.Solana; contract: string }
    | { identifier: `${Chain}.${string}` },
) {
  const { loadTokenLists } = await import("../tokens");
  const tokenLists = await loadTokenLists();

  for (const tokenList of Object.values(tokenLists)) {
    for (const { identifier, chain: tokenChain, ...rest } of tokenList.tokens) {
      if ("identifier" in params && identifier === params.identifier) {
        return identifier as TokenNames;
      }

      if (
        "address" in rest &&
        "chain" in params &&
        tokenChain === params.chain &&
        rest.address &&
        rest.address.toLowerCase() === params.contract.toLowerCase()
      )
        return identifier as TokenNames;
    }
  }

  return;
}
