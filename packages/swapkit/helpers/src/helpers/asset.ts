import { AssetValue } from "../modules/assetValue";
import { RequestClient } from "../modules/requestClient";
import { BaseDecimal, Chain, ChainToRPC, type EVMChain, EVMChains } from "../types/chains";
import type { RadixCoreStateResourceDTO } from "../types/radix";
import type { TokenNames } from "../types/tokens";

const getDecimalMethodHex = "0x313ce567";

export type CommonAssetString = (typeof CommonAssetStrings)[number] | Chain;

export type ConditionalAssetValueReturn<T extends boolean> = T extends true
  ? Promise<AssetValue[]>
  : AssetValue[];

export const CommonAssetStrings = [
  `${Chain.Maya}.MAYA`,
  `${Chain.Ethereum}.THOR`,
  `${Chain.Ethereum}.vTHOR`,
  `${Chain.Kujira}.USK`,
] as const;

const getContractDecimals = async ({ chain, to }: { chain: EVMChain; to: string }) => {
  try {
    const { result } = await RequestClient.post<{ result: string }>(ChainToRPC[chain], {
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
    console.error(error);
    return BaseDecimal[chain];
  }
};

const getRadixResourceDecimals = async ({ symbol }: { symbol: string }) => {
  try {
    const resourceAddress = symbol.split("-")[1]?.toLowerCase();

    const { manager } = await RequestClient.post<RadixCoreStateResourceDTO>(
      `${ChainToRPC[Chain.Radix]}/state/resource`,
      {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
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
};

const getETHAssetDecimal = (symbol: string) => {
  if (symbol === Chain.Ethereum) return BaseDecimal.ETH;
  const splitSymbol = symbol.split("-");
  const address =
    splitSymbol.length === 1 ? undefined : splitSymbol[splitSymbol.length - 1]?.toLowerCase();

  return address?.startsWith("0x")
    ? getContractDecimals({ chain: Chain.Ethereum, to: address })
    : BaseDecimal.ETH;
};

const getAVAXAssetDecimal = (symbol: string) => {
  const splitSymbol = symbol.split("-");
  const address = splitSymbol.length === 1 ? undefined : splitSymbol[splitSymbol.length - 1];

  return address?.startsWith("0x")
    ? getContractDecimals({ chain: Chain.Avalanche, to: address.toLowerCase() })
    : BaseDecimal.AVAX;
};

const getBSCAssetDecimal = (symbol: string) => {
  if (symbol === Chain.BinanceSmartChain) return BaseDecimal.BSC;

  return BaseDecimal.BSC;
};

const getRadixAssetDecimal = (symbol: string) => {
  if (symbol === Chain.Radix) return BaseDecimal.XRD;

  return getRadixResourceDecimals({ symbol });
};

export const getDecimal = ({ chain, symbol }: { chain: Chain; symbol: string }) => {
  switch (chain) {
    case Chain.Ethereum:
      return getETHAssetDecimal(symbol);
    case Chain.Avalanche:
      return getAVAXAssetDecimal(symbol);
    case Chain.BinanceSmartChain:
      return getBSCAssetDecimal(symbol);
    case Chain.Radix:
      return getRadixAssetDecimal(symbol);
    default:
      return BaseDecimal[chain];
  }
};

export const getGasAsset = ({ chain }: { chain: Chain }) => {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Base:
    case Chain.Optimism:
      return AssetValue.from({ asset: `${chain}.ETH` });
    case Chain.Maya:
      return AssetValue.from({ asset: `${chain}.CACAO` });
    case Chain.Cosmos:
      return AssetValue.from({ asset: `${chain}.ATOM` });
    case Chain.BinanceSmartChain:
      return AssetValue.from({ asset: `${chain}.BNB` });
    case Chain.THORChain:
      return AssetValue.from({ asset: `${chain}.RUNE` });

    default:
      return AssetValue.from({ asset: `${chain}.${chain}` });
  }
};

export const isGasAsset = ({ chain, symbol }: { chain: Chain; symbol: string }) => {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Base:
    case Chain.Optimism:
      return symbol === "ETH";
    case Chain.Maya:
      return symbol === "CACAO";
    case Chain.Cosmos:
      return symbol === "ATOM";
    case Chain.BinanceSmartChain:
      return symbol === "BNB";
    case Chain.THORChain:
      return symbol === "RUNE";

    default:
      return symbol === chain;
  }
};

export const getCommonAssetInfo = (assetString: CommonAssetString) => {
  switch (assetString) {
    case Chain.Arbitrum:
    case Chain.Base:
    case Chain.Optimism:
      return { identifier: `${assetString}.ETH`, decimal: BaseDecimal[assetString] };

    case `${Chain.Ethereum}.THOR`:
      return { identifier: "ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044", decimal: 18 };
    case `${Chain.Ethereum}.vTHOR`:
      return { identifier: "ETH.vTHOR-0x815c23eca83261b6ec689b60cc4a58b54bc24d8d", decimal: 18 };
    case Chain.Cosmos:
      return { identifier: `${assetString}.ATOM`, decimal: BaseDecimal[assetString] };
    case Chain.THORChain:
      return { identifier: `${assetString}.RUNE`, decimal: BaseDecimal[assetString] };
    case Chain.BinanceSmartChain:
      return { identifier: `${assetString}.BNB`, decimal: BaseDecimal[assetString] };
    case Chain.Maya:
      return { identifier: `${assetString}.CACAO`, decimal: 10 };
    case Chain.Radix:
      return { identifier: `${Chain.Radix}.XRD`, decimal: BaseDecimal[assetString] };

    case `${Chain.Maya}.MAYA`:
      return { identifier: assetString, decimal: 4 };
    case `${Chain.Kujira}.USK`:
      return { identifier: assetString, decimal: 6 };

    default:
      return { identifier: `${assetString}.${assetString}`, decimal: BaseDecimal[assetString] };
  }
};

export const getAssetType = ({ chain, symbol }: { chain: Chain; symbol: string }) => {
  if (symbol.includes("/")) return "Synth";

  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Base:
      return symbol === Chain.Ethereum ? "Native" : chain;

    case Chain.Cosmos:
      return symbol === "ATOM" ? "Native" : chain;
    case Chain.BinanceSmartChain:
      return symbol === "BNB" ? "Native" : chain;
    case Chain.Maya:
      return symbol === "CACAO" ? "Native" : chain;
    case Chain.THORChain:
      return symbol === "RUNE" ? "Native" : chain;

    default:
      return symbol === chain ? "Native" : chain;
  }
};

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

const potentialScamRegex = new RegExp(
  /(.)\1{6}|\.ORG|\.NET|\.FINANCE|\.COM|WWW|HTTP|\\\\|\/\/|[\s$%:[\]]/,
  "gmi",
);

const evmAssetHasAddress = (assetString: string) => {
  const [chain, symbol] = assetString.split(".") as [EVMChain, string];
  if (!EVMChains.includes(chain as EVMChain)) return true;
  const splitSymbol = symbol.split("-");
  const address = splitSymbol.length === 1 ? undefined : splitSymbol[splitSymbol.length - 1];

  return isGasAsset({ chain: chain as Chain, symbol }) || !!address;
};

export const filterAssets = (
  tokens: {
    value: string;
    decimal: number;
    chain: Chain;
    symbol: string;
  }[],
) =>
  tokens.filter(({ chain, value, symbol }) => {
    const assetString = `${chain}.${symbol}`;

    return (
      !potentialScamRegex.test(assetString) && evmAssetHasAddress(assetString) && value !== "0"
    );
  });

export async function findAssetBy(
  params:
    | { chain: EVMChain | Chain.Radix | Chain.Solana; contract: string }
    | { identifier: `${Chain}.${string}` },
) {
  const tokenPackages = await import("@swapkit/tokens");

  for (const tokenList of Object.values(tokenPackages)) {
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
