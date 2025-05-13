import { match } from "ts-pattern";
import { AssetValue } from "../modules/assetValue";
import { RequestClient } from "../modules/requestClient";
import { SKConfig } from "../modules/swapKitConfig";
import { BaseDecimal, Chain, type EVMChain, EVMChains, UTXOChains } from "../types/chains";
import type { RadixCoreStateResourceDTO } from "../types/radix";
import type { TokenNames } from "../types/tokens";

export type CommonAssetString = (typeof CommonAssetStrings)[number] | Chain;

export type ConditionalAssetValueReturn<T extends boolean> = T extends true
  ? Promise<AssetValue[]>
  : AssetValue[];

export const CommonAssetStrings = [
  `${Chain.Maya}.MAYA`,
  `${Chain.Ethereum}.THOR`,
  `${Chain.Ethereum}.vTHOR`,
  `${Chain.Kujira}.USK`,
  `${Chain.Ethereum}.FLIP`,
  `${Chain.Radix}.XRD`,
] as const;

const ethGasChains = [
  Chain.Arbitrum,
  Chain.Base,
  Chain.Ethereum,
  Chain.Optimism,
  Chain.Polygon,
] as const;

async function getContractDecimals({ chain, to }: { chain: EVMChain; to: string }) {
  const getDecimalMethodHex = "0x313ce567";

  try {
    const { result } = await RequestClient.post<{ result: string }>(
      SKConfig.get("rpcUrls")[chain],
      {
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
      },
    );

    return Number.parseInt(BigInt(result || BaseDecimal[chain]).toString());
  } catch (error) {
    console.error(error);
    return BaseDecimal[chain];
  }
}

async function getRadixAssetDecimal(symbol: string) {
  if (symbol === Chain.Radix) return BaseDecimal.XRD;

  try {
    const resourceAddress = symbol.split("-")[1]?.toLowerCase();

    const { manager } = await RequestClient.post<RadixCoreStateResourceDTO>(
      `${SKConfig.get("rpcUrls").XRD}/state/resource`,
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
    console.error(error);
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
    .with(Chain.BinanceSmartChain, () => symbol === "BNB")
    .with(Chain.Maya, () => symbol === "CACAO")
    .with(Chain.Cosmos, () => symbol === "ATOM")
    .with(Chain.THORChain, () => symbol === "RUNE")
    .with(Chain.Radix, () => `${chain}.${symbol}` === getCommonAssetInfo(chain).identifier)
    .otherwise(() => symbol === chain);
}

export const getCommonAssetInfo = (assetString: CommonAssetString) => {
  const decimal = BaseDecimal[assetString as Chain];

  const commonAssetInfo = match(assetString.toUpperCase())
    .with(...ethGasChains, () => ({
      identifier: `${assetString.toUpperCase()}.ETH`,
      decimal,
    }))
    .with(Chain.THORChain, () => ({
      identifier: `${assetString.toUpperCase()}.RUNE`,
      decimal,
    }))
    .with(Chain.Cosmos, () => ({ identifier: `${assetString.toUpperCase()}.ATOM`, decimal }))
    .with(Chain.Maya, () => ({
      identifier: `${assetString.toUpperCase()}.CACAO`,
      decimal: 10,
    }))
    .with(Chain.BinanceSmartChain, () => ({
      identifier: `${assetString.toUpperCase()}.BNB`,
      decimal,
    }))
    .with(Chain.Avalanche, () => ({
      identifier: `${assetString.toUpperCase()}.AVAX`,
      decimal,
    }))
    .with(
      ...UTXOChains,
      Chain.Solana,
      Chain.Chainflip,
      Chain.Kujira,
      Chain.Ripple,
      Chain.Polkadot,
      () => ({ identifier: `${assetString.toUpperCase()}.${assetString.toUpperCase()}`, decimal }),
    )
    .with(Chain.Radix, "XRD.XRD", () => ({
      identifier: "XRD.XRD-resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd",
      decimal,
    }))
    .with("KUJI.USK", () => ({ identifier: assetString.toUpperCase(), decimal: 6 }))
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
    .with("MAYA.MAYA", () => ({ identifier: assetString.toUpperCase(), decimal: 4 }))
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
    .with(Chain.Arbitrum, Chain.Optimism, Chain.Base, () => symbol === Chain.Ethereum)
    .with(Chain.Cosmos, () => symbol === "ATOM")
    .with(Chain.BinanceSmartChain, () => symbol === "BNB")
    .with(Chain.Maya, () => symbol === "CACAO")
    .with(Chain.THORChain, () => symbol === "RUNE")
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
    | { chain: EVMChain | Chain.Radix | Chain.Solana; contract: string }
    | { identifier: `${Chain}.${string}` },
) {
  const { tokenLists } = await import("@swapkit/helpers/tokens");

  for (const tokenList of Object.values(tokenLists)) {
    for (const { identifier, chain: tokenChain, ...rest } of tokenList.tokens) {
      if ("identifier" in params && identifier === params.identifier) {
        return identifier as TokenNames;
      }

      if (
        "address" in rest &&
        "chain" in params &&
        tokenChain === params.chain &&
        rest.address.toLowerCase() === params.contract.toLowerCase()
      )
        return identifier as TokenNames;
    }
  }

  return;
}
