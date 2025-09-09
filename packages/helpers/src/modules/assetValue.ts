import type { TokenListName, TokenNames, TokenTax } from "@swapkit/tokens";
import { getAddress } from "ethers";
import { match } from "ts-pattern";
import { BaseDecimal, Chain, type ChainId, ChainToChainId, type EVMChain, EVMChains } from "../types/chains";
import {
  assetFromString,
  type CommonAssetString,
  getAssetType,
  getCommonAssetInfo,
  getDecimal,
  isGasAsset,
} from "../utils/asset";
import { warnOnce } from "../utils/others";
import { validateIdentifier } from "../utils/validators";

import type { NumberPrimitives } from "./bigIntArithmetics";
import { BigIntArithmetics, formatBigIntToSafeValue } from "./bigIntArithmetics";
import { SwapKitError } from "./swapKitError";
import type { SwapKitValueType } from "./swapKitNumber";

const CASE_SENSITIVE_CHAINS = [Chain.Solana, Chain.Tron, Chain.Near];

const staticTokensMap = new Map<
  TokenNames | string,
  { tax?: TokenTax; decimal: number; identifier: string; logoURI?: string }
>();

type ConditionalAssetValueReturn<T extends { asyncTokenLookup?: boolean }> = T["asyncTokenLookup"] extends true
  ? Promise<AssetValue>
  : AssetValue;

type AssetIdentifier = { asset: CommonAssetString | TokenNames } | { asset: string } | { chain: Chain };

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
    this.isSynthetic = assetInfo.isSynthetic;
    this.isTradeAsset = assetInfo.isTradeAsset;
    this.isGasAsset = assetInfo.isGasAsset;
    this.chainId = ChainToChainId[assetInfo.chain];
  }

  toString({ includeSynthProtocol }: { includeSynthProtocol?: boolean } = {}) {
    return (this.isSynthetic || this.isTradeAsset) && !includeSynthProtocol
      ? this.symbol
      : `${this.chain}.${this.symbol}`;
  }
  toUrl() {
    if (this.isSynthetic) {
      // Example: THOR.AVAX/AVAX -> THOR.AVAX.AVAX
      return `${this.chain}.${this.symbol.replace(/\//g, ".")}`;
    }
    if (this.isTradeAsset) {
      // Example: MAYA.CACAO~CACAO -> MAYA.CACAO..CACAO
      return `${this.chain}.${this.symbol.replace(/~/g, "..")}`;
    }

    // Encode dots in the symbol to avoid ambiguity, primarily for NEAR
    // Example: NEAR.wrap.near -> NEAR.wrap__near
    const encodedSymbol = this.symbol.replace(/\./g, "__");
    return `${this.chain}.${encodedSymbol}`;
  }

  getIconUrl() {
    const token = staticTokensMap.get(this.toString());
    return token?.logoURI;
  }

  eqAsset({ chain, symbol }: { chain: Chain; symbol: string }) {
    return this.chain === chain && this.symbol === symbol;
  }

  eq(assetValue: AssetValue) {
    return this.eqAsset(assetValue) && this.eqValue(assetValue);
  }

  static fromUrl(urlAsset: string, value: NumberPrimitives = 0) {
    const firstDotIndex = urlAsset.indexOf(".");

    if (firstDotIndex === -1) {
      throw new SwapKitError({ errorKey: "helpers_invalid_asset_url", info: { urlAsset } });
    }

    const chain = urlAsset.substring(0, firstDotIndex);
    const rest = urlAsset.substring(firstDotIndex + 1);
    let asset: string;

    // Check for trade asset encoding '..'
    if (rest.includes("..")) {
      asset = `${chain}.${rest.replace(/\.\./g, "~")}`;
    }
    // Check for THORChain synth encoding (e.g., THOR.AVAX.AVAX)
    else if ([Chain.THORChain, Chain.Maya].includes(chain as Chain) && rest.includes(".")) {
      asset = `${chain}.${rest.replace(/\./g, "/")}`;
    }
    // Default case: decode our '__' for NEAR and others
    else {
      asset = `${chain}.${rest.replace(/__/g, ".")}`;
    }

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

    const { chain, isSynthetic, isTradeAsset } = getAssetInfo(unsafeIdentifier);
    const token = staticTokensMap.get(
      CASE_SENSITIVE_CHAINS.includes(chain)
        ? (unsafeIdentifier as TokenNames)
        : (unsafeIdentifier.toUpperCase() as TokenNames),
    );

    const tokenDecimal = token?.decimal || commonAssetDecimal;

    warnOnce({
      condition: !(asyncTokenLookup || tokenDecimal),
      id: `assetValue_static_decimal_not_found_${chain}`,
      warning: `Couldn't find static decimal for one or more tokens on ${chain} (Using default ${BaseDecimal[chain]} decimal as fallback).
This can result in incorrect calculations and mess with amount sent on transactions.
You can load static assets by installing @swapkit/tokens package and calling AssetValue.loadStaticAssets()
or by passing asyncTokenLookup: true to the from() function, which will make it async and return a promise.`,
    });

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
        : new AssetValue({ decimal, identifier, tax, value: adjustedValue });

    return assetValue as ConditionalAssetValueReturn<T>;
  }

  static async loadStaticAssets(listNames?: TokenListName[]) {
    const { loadTokenLists } = await import("@swapkit/tokens");
    const lists = await loadTokenLists(listNames);

    for (const { tokens } of Object.values(lists)) {
      for (const { identifier, chain, ...rest } of tokens) {
        const tokenKey = (
          CASE_SENSITIVE_CHAINS.includes(chain as Chain) ? identifier : identifier.toUpperCase()
        ) as TokenNames;
        const tokenDecimal = "decimals" in rest ? rest.decimals : BaseDecimal[chain as Chain];

        staticTokensMap.set(tokenKey, { decimal: tokenDecimal, identifier });
      }
    }

    return true;
  }

  static setStaticAssets(
    tokenMap: Map<
      string,
      { tax?: TokenTax; identifier: string; chain: Chain } & ({ decimal: number } | { decimals: number })
    >,
  ) {
    staticTokensMap.clear();
    for (const [key, value] of tokenMap.entries()) {
      const tokenKey = (
        CASE_SENSITIVE_CHAINS.includes(value.chain) ? value.identifier : value.identifier.toUpperCase()
      ) as TokenNames;
      const tokenDecimal = "decimals" in value ? value.decimals : value.decimal;
      staticTokensMap.set(key, { ...value, decimal: tokenDecimal, identifier: tokenKey });
    }
    return true;
  }
}

export function getMinAmountByChain(chain: Chain) {
  const asset = AssetValue.from({ chain });

  return match(chain)
    .with(Chain.Bitcoin, Chain.Litecoin, Chain.BitcoinCash, Chain.Dash, () => asset.set(0.00010001))
    .with(Chain.Dogecoin, () => asset.set(1.00000001))
    .with(Chain.Avalanche, Chain.Ethereum, Chain.Arbitrum, Chain.BinanceSmartChain, () => asset.set(0.00000001))
    .with(Chain.THORChain, Chain.Maya, () => asset.set(0))
    .with(Chain.Cosmos, Chain.Kujira, () => asset.set(0.000001))
    .otherwise(() => asset.set(0.00000001));
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
    staticTokensMap.set(modifiedIdentifier, { decimal, identifier });
  }

  return new AssetValue({ decimal, identifier, value: safeValue(value, decimal) });
}

function createSyntheticAssetValue(identifier: string, value: NumberPrimitives = 0) {
  const chain = identifier.includes(".") ? (identifier.split(".")?.[0]?.toUpperCase() as Chain) : undefined;
  const isMayaOrThor = chain ? [Chain.Maya, Chain.THORChain].includes(chain) : false;

  const assetSeparator = identifier.slice(0, 14).includes("~") ? "~" : "/";

  const [synthChain, symbol] = isMayaOrThor
    ? identifier.split(".").slice(1).join().split(assetSeparator)
    : identifier.split(assetSeparator);

  if (!(synthChain && symbol)) {
    throw new SwapKitError({ errorKey: "helpers_invalid_asset_identifier", info: { identifier } });
  }

  return new AssetValue({
    decimal: 8,
    identifier: `${chain || Chain.THORChain}.${synthChain}${assetSeparator}${symbol}`,
    value: safeValue(value, 8),
  });
}

function safeValue(value: NumberPrimitives, decimal: number) {
  return typeof value === "bigint" ? formatBigIntToSafeValue({ bigIntDecimal: decimal, decimal, value }) : value;
}

function validateAssetChain(assetOrChain: AssetIdentifier) {
  const chain = match(assetOrChain)
    .when(
      (x): x is { chain: Chain } => "chain" in x && x.chain !== undefined,
      ({ chain }) => chain,
    )
    .otherwise((x) => {
      const assetInfo = assetFromString((x as { asset: string }).asset);
      return assetInfo.synth ? Chain.THORChain : assetInfo.chain;
    });

  // TODO: move to SKConfig chains once we support it throughout sdk
  if (!Object.values(Chain).includes(chain.toUpperCase() as Chain)) {
    throw new SwapKitError({
      errorKey: "helpers_invalid_asset_identifier",
      info: { message: "Please use the AssetValue constructor for unsupported chains" },
    });
  }
}

function getAssetString(assetOrChain: AssetIdentifier) {
  validateAssetChain(assetOrChain);

  if ("chain" in assetOrChain) return assetOrChain.chain;

  const { chain, symbol } = assetFromString(assetOrChain.asset);
  const isNativeChain = getAssetType({ chain, symbol }) === "Native";

  return isNativeChain ? chain : assetOrChain.asset;
}

function getAssetInfo(identifier: string) {
  const shortIdentifier = identifier.slice(0, 14);
  const isSynthetic = shortIdentifier.includes("/");
  const isTradeAsset = shortIdentifier.includes("~");
  const isSynthOrTrade = isSynthetic || isTradeAsset;

  // Logic for Synthetic and Trade Assets
  if (isSynthOrTrade) {
    const splitIdentifier = identifier.split(".");
    const identifierChain = splitIdentifier[0]?.toUpperCase() as Chain;
    const isThorOrMaya = [Chain.THORChain, Chain.Maya].includes(identifierChain);
    const assetSeparator = isTradeAsset ? "~" : "/";

    const [synthChain, synthSymbol = ""] = isThorOrMaya
      ? splitIdentifier.slice(1).join(".").split(assetSeparator)
      : identifier.split(assetSeparator);

    if (!(synthChain && synthSymbol)) {
      throw new SwapKitError({ errorKey: "helpers_invalid_asset_identifier", info: { identifier } });
    }

    // Get the ticker from the base symbol (e.g., "AVAX" from "AVAX/AVAX")
    const { ticker, address } = getAssetBaseInfo({ chain: synthChain as Chain, symbol: synthSymbol });
    const finalSymbol = `${synthChain}${assetSeparator}${synthSymbol}`;

    return {
      address,
      chain: identifierChain,
      isGasAsset: false,
      isSynthetic,
      isSynthOrTrade,
      isTradeAsset,
      symbol: finalSymbol,
      ticker, // This is now correct (e.g., "AVAX")
    };
  }

  // Logic for all other assets (including NEAR)
  const firstDotIndex = identifier.indexOf(".");
  const chain = (firstDotIndex === -1 ? identifier : identifier.substring(0, firstDotIndex)).toUpperCase() as Chain;
  const assetSymbol = firstDotIndex === -1 ? identifier : identifier.substring(firstDotIndex + 1);

  const { address, ticker } = getAssetBaseInfo({ chain, symbol: assetSymbol });

  let formattedAddress: string | undefined;
  try {
    formattedAddress =
      address && EVMChains.includes(chain as EVMChain) && getAddress(address) ? getAddress(address) : address;
  } catch (_error) {
    formattedAddress = address;
  }

  const finalSymbol = formattedAddress ? `${ticker}-${formattedAddress}` : assetSymbol;

  return {
    address: formattedAddress,
    chain,
    isGasAsset: isGasAsset({ chain, symbol: assetSymbol }),
    isSynthetic,
    isSynthOrTrade,
    isTradeAsset,
    symbol: finalSymbol,
    ticker,
  };
}

/**
 * Ticker is everything before the last hyphen. Address is after.
 * This is the standard for EVM chains and most others.
 * Example: "PENDLE-LPT-0x123..." -> { ticker: "PENDLE-LPT", address: "0x123..." }
 */
function parseWithLastSeparator(symbol: string) {
  const lastDashIndex = symbol.lastIndexOf("-");
  if (lastDashIndex === -1) {
    return { address: undefined, ticker: symbol };
  }
  const ticker = symbol.substring(0, lastDashIndex);
  const address = symbol.substring(lastDashIndex + 1);
  return { address, ticker };
}

/**
 * Ticker is everything before the first hyphen. Address is after.
 * This is specific to NEAR's convention.
 * Example: "PURGE-purge.near" -> { ticker: "PURGE", address: "purge.near" }
 */
function parseWithFirstSeparator(symbol: string) {
  const firstDashIndex = symbol.indexOf("-");
  if (firstDashIndex === -1) {
    return { address: undefined, ticker: symbol };
  }
  const ticker = symbol.substring(0, firstDashIndex);
  const address = symbol.substring(firstDashIndex + 1);
  return { address, ticker };
}

function getAssetBaseInfo({ symbol, chain }: { symbol: string; chain: Chain }) {
  let parsed: { ticker: string; address: string | undefined };

  // Select the correct parsing strategy based on the chain
  switch (chain) {
    case Chain.Near:
      parsed = parseWithFirstSeparator(symbol);
      break;

    // EVM chains and most others use the "last separator" convention.
    case Chain.Ethereum:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.BinanceSmartChain:
    case Chain.Polygon:
    case Chain.Optimism:
      parsed = parseWithLastSeparator(symbol);
      break;

    // Use the most common convention as a fallback for any unlisted chains.
    default:
      parsed = parseWithLastSeparator(symbol);
      break;
  }

  const { ticker, address } = parsed;

  // Apply case-sensitivity rules after parsing
  const finalAddress = address && !CASE_SENSITIVE_CHAINS.includes(chain) ? address.toLowerCase() : address;

  return { address: finalAddress, ticker };
}
