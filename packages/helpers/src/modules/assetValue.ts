import { BaseDecimal, Chain, type ChainId, ChainToChainId } from "../types/chains";
import type { TokenNames, TokenTax } from "../types/tokens";
import {
  type CommonAssetString,
  assetFromString,
  getAssetType,
  getCommonAssetInfo,
  getDecimal,
  isGasAsset,
} from "../utils/asset";
import { warnOnce } from "../utils/others";
import { type TokenListName, loadTokenLists } from "../utils/tokens";
import { validateIdentifier } from "../utils/validators";

import type { NumberPrimitives } from "./bigIntArithmetics";
import { BigIntArithmetics, formatBigIntToSafeValue } from "./bigIntArithmetics";
import { SwapKitError } from "./swapKitError";
import type { SwapKitValueType } from "./swapKitNumber";

const staticTokensMap = new Map<
  TokenNames,
  { tax?: TokenTax; decimal: number; identifier: string }
>();

type ConditionalAssetValueReturn<T extends { asyncTokenLookup?: boolean }> =
  T["asyncTokenLookup"] extends true ? Promise<AssetValue> : AssetValue;

type AssetIdentifier =
  | { asset: CommonAssetString | TokenNames }
  | { asset: string }
  | { chain: Chain };

type AssetValueFromParams = AssetIdentifier & {
  value?: NumberPrimitives | SwapKitValueType;
  fromBaseDecimal?: number;
  asyncTokenLookup?: boolean;
};

export class AssetValue extends BigIntArithmetics {
  address?: string;
  chain: Chain;
  isGasAsset = false;
  isSynthetic = false;
  isTradeAsset = false;
  symbol: string;
  tax?: TokenTax;
  ticker: string;
  type: ReturnType<typeof getAssetType>;
  chainId: ChainId;

  constructor({
    value,
    decimal,
    tax,
    chain,
    symbol,
    identifier,
  }: { decimal: number; value: SwapKitValueType; tax?: TokenTax } & (
    | { chain: Chain; symbol: string; identifier?: never }
    | { identifier: string; chain?: never; symbol?: never }
  )) {
    super(typeof value === "object" ? value : { decimal, value });

    const assetInfo = getAssetInfo(identifier || `${chain}.${symbol}`);

    this.type = getAssetType(assetInfo);
    this.tax = tax;
    this.chain = assetInfo.chain;
    this.ticker = assetInfo.ticker;
    this.symbol = assetInfo.symbol;
    this.address = assetInfo.address;
    this.isTradeAsset = assetInfo.isTradeAsset;
    this.isGasAsset = assetInfo.isGasAsset;
    this.chainId = ChainToChainId[assetInfo.chain];
  }

  toString({ includeSynthProtocol }: { includeSynthProtocol?: boolean } = {}) {
    return this.isTradeAsset && !includeSynthProtocol
      ? this.symbol
      : `${this.chain}.${this.symbol}`;
  }

  toUrl() {
    return this.isTradeAsset ? `${this.chain}.${this.symbol.replace("~", "..")}` : this.toString();
  }

  eqAsset({ chain, symbol }: { chain: Chain; symbol: string }) {
    return this.chain === chain && this.symbol === symbol;
  }

  eq(assetValue: AssetValue) {
    return this.eqAsset(assetValue) && this.eqValue(assetValue);
  }

  // THOR.RUNE
  // THOR.ETH.ETH
  // ETH.THOR-0x1234567890
  static fromUrl(urlAsset: string, value: NumberPrimitives = 0) {
    const [chain, ticker, symbol] = urlAsset.split(".");
    if (!(chain && ticker)) {
      throw new SwapKitError({
        errorKey: "helpers_invalid_asset_url",
        info: { urlAsset },
      });
    }

    const asset = chain === Chain.THORChain && symbol ? `${chain}.${ticker}/${symbol}` : urlAsset;

    return AssetValue.from({ asset, value });
  }

  static from<T extends {}>({
    value = 0,
    fromBaseDecimal,
    asyncTokenLookup,
    ...fromAssetOrChain
  }: T & AssetValueFromParams): ConditionalAssetValueReturn<T> {
    const parsedValue = value instanceof BigIntArithmetics ? value.getValue("string") : value;
    const assetOrChain = getAssetString(fromAssetOrChain);

    const { identifier: unsafeIdentifier, decimal: commonAssetDecimal } = getCommonAssetInfo(
      assetOrChain as CommonAssetString,
    );

    const { chain, isTradeAsset, isSynthetic } = getAssetInfo(unsafeIdentifier);
    const token = staticTokensMap.get(
      chain === Chain.Solana
        ? (unsafeIdentifier as TokenNames)
        : (unsafeIdentifier.toUpperCase() as TokenNames),
    );
    const tokenDecimal = token?.decimal || commonAssetDecimal;

    warnOnce(
      !(asyncTokenLookup || tokenDecimal),
      `Couldn't find static decimal for one or more tokens on ${chain} (Using default ${BaseDecimal[chain]} decimal as fallback).
This can result in incorrect calculations and mess with amount sent on transactions.
You can load static assets by installing @swapkit/tokens package and calling AssetValue.loadStaticAssets()
or by passing asyncTokenLookup: true to the from() function, which will make it async and return a promise.`,
    );

    const { decimal, identifier, tax } = token || {
      decimal: tokenDecimal || BaseDecimal[chain],
      identifier: unsafeIdentifier,
    };

    const isSynthOrTrade = isSynthetic || isTradeAsset;

    const adjustedValue = fromBaseDecimal
      ? safeValue(BigInt(parsedValue), fromBaseDecimal)
      : safeValue(parsedValue, decimal);

    const assetValue = asyncTokenLookup
      ? createAssetValue(identifier, fromBaseDecimal ? adjustedValue : parsedValue)
      : isSynthOrTrade
        ? createSyntheticAssetValue(identifier, adjustedValue)
        : new AssetValue({ tax, decimal, identifier, value: adjustedValue });

    return assetValue as ConditionalAssetValueReturn<T>;
  }

  static async loadStaticAssets(listNames?: TokenListName[]) {
    const lists = await loadTokenLists(listNames);

    for (const { tokens } of Object.values(lists)) {
      for (const { identifier, chain, ...rest } of tokens) {
        const tokenKey = (chain === "SOL" ? identifier : identifier.toUpperCase()) as TokenNames;
        const tokenDecimal = "decimals" in rest ? rest.decimals : BaseDecimal[chain as Chain];

        staticTokensMap.set(tokenKey, { identifier, decimal: tokenDecimal });
      }
    }

    return true;
  }
}

export function getMinAmountByChain(chain: Chain) {
  const asset = AssetValue.from({ chain });

  switch (chain) {
    case Chain.Bitcoin:
    case Chain.Litecoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
      return asset.set(0.00010001);

    case Chain.Dogecoin:
      return asset.set(1.00000001);

    case Chain.Avalanche:
    case Chain.Ethereum:
    case Chain.Arbitrum:
    case Chain.BinanceSmartChain:
      return asset.set(0.00000001);

    case Chain.THORChain:
    case Chain.Maya:
      return asset.set(0);

    case Chain.Cosmos:
    case Chain.Kujira:
      return asset.set(0.000001);

    default:
      return asset.set(0.00000001);
  }
}

async function createAssetValue(identifier: string, value: NumberPrimitives = 0) {
  validateIdentifier(identifier);

  const isCaseSensitiveChain = identifier.includes("SOL.");

  const modifiedIdentifier = isCaseSensitiveChain
    ? (identifier as TokenNames)
    : (identifier.toUpperCase() as TokenNames);

  const staticToken = staticTokensMap.get(modifiedIdentifier);
  const decimal = staticToken?.decimal || (await getDecimal(getAssetInfo(identifier)));
  if (!staticToken) {
    staticTokensMap.set(modifiedIdentifier, { identifier, decimal });
  }

  return new AssetValue({
    decimal,
    value: safeValue(value, decimal),
    identifier,
  });
}

function createSyntheticAssetValue(identifier: string, value: NumberPrimitives = 0) {
  const chain = identifier.includes(".")
    ? (identifier.split(".")?.[0]?.toUpperCase() as Chain)
    : undefined;
  const isMayaOrThor = chain ? [Chain.Maya, Chain.THORChain].includes(chain) : false;

  const assetSeparator = identifier.slice(0, 14).includes("~") ? "~" : "/";

  const [synthChain, symbol] = isMayaOrThor
    ? identifier.split(".").slice(1).join().split(assetSeparator)
    : identifier.split(assetSeparator);

  if (!(synthChain && symbol)) {
    throw new SwapKitError({
      errorKey: "helpers_invalid_asset_identifier",
      info: { identifier },
    });
  }

  return new AssetValue({
    decimal: 8,
    value: safeValue(value, 8),
    identifier: `${chain || Chain.THORChain}.${synthChain}${assetSeparator}${symbol}`,
  });
}

function safeValue(value: NumberPrimitives, decimal: number) {
  return typeof value === "bigint"
    ? formatBigIntToSafeValue({ value, bigIntDecimal: decimal, decimal })
    : value;
}

function getAssetString(assetOrChain: AssetIdentifier) {
  if ("chain" in assetOrChain) return assetOrChain.chain;

  const { chain, symbol } = assetFromString(assetOrChain.asset);
  const isNativeChain = getAssetType({ chain, symbol }) === "Native";

  return isNativeChain ? chain : assetOrChain.asset;
}

function getAssetInfo(identifier: string) {
  const shortIdentifier = identifier.slice(0, 14);
  const splitIdentifier = identifier.split(".");
  const identifierChain = splitIdentifier[0]?.toUpperCase() as Chain;
  const isThorOrMaya = [Chain.THORChain, Chain.Maya].includes(identifierChain);

  const isSynthetic = shortIdentifier.includes("/");
  const isTradeAsset = shortIdentifier.includes("~");
  const isSynthOrTrade = isSynthetic || isTradeAsset;
  const assetSeparator = isTradeAsset ? "~" : "/";

  const [synthChain, synthSymbol = ""] = isThorOrMaya
    ? splitIdentifier.slice(1).join().split(assetSeparator)
    : identifier.split(assetSeparator);

  if (isSynthOrTrade && !(synthChain && synthSymbol)) {
    throw new SwapKitError({
      errorKey: "helpers_invalid_asset_identifier",
      info: { identifier },
    });
  }

  const [chain, ...rest] = (
    identifier.includes(".") && !isSynthOrTrade ? identifier : `${identifierChain}.${synthSymbol}`
  ).split(".") as [Chain, string];

  const assetSymbol = isSynthOrTrade ? synthSymbol : rest.join(".");

  const { address, ticker } = getAssetBaseInfo({ symbol: assetSymbol, chain });
  const symbol =
    (isSynthOrTrade ? `${synthChain}${assetSeparator}` : "") +
    (address ? `${ticker}-${address ?? ""}` : assetSymbol);

  return {
    address,
    chain,
    isSynthOrTrade,
    isSynthetic,
    isTradeAsset,
    ticker,
    symbol,
    isGasAsset: isGasAsset({ chain, symbol: assetSymbol }),
  };
}

function getAssetBaseInfo({ symbol, chain }: { symbol: string; chain: Chain }) {
  const splitSymbol = symbol.split("-");
  const unformattedAddress =
    splitSymbol.length === 1 ? undefined : splitSymbol[splitSymbol.length - 1];

  const address = chain === Chain.Solana ? unformattedAddress : unformattedAddress?.toLowerCase();
  const ticker = (
    splitSymbol.length === 1 ? splitSymbol[0] : splitSymbol.slice(0, -1).join("-")
  ) as string;

  return { address, ticker };
}
