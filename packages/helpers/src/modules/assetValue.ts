import type { TokenListName, TokenNames, TokenTax } from "@swapkit/tokens";
import { AllChains, Chain, type ChainId, type EVMChain, EVMChains, getChainConfig } from "@swapkit/types";
import { getAddress } from "ethers";
import { match } from "ts-pattern";
import {
  assetFromString,
  type CommonAssetString,
  fetchTokenInfo,
  getAssetType,
  getCommonAssetInfo,
  isGasAsset,
} from "../utils/asset";
import { warnOnce } from "../utils/others";
import { validateIdentifier } from "../utils/validators";

import type { NumberPrimitives } from "./bigIntArithmetics";
import { BigIntArithmetics, formatBigIntToSafeValue } from "./bigIntArithmetics";
import { SwapKitError } from "./swapKitError";
import type { SwapKitValueType } from "./swapKitNumber";

const CASE_SENSITIVE_CHAINS: Chain[] = [Chain.Solana, Chain.Tron, Chain.Near, Chain.Sui];
const TC_CHAINS: Chain[] = [Chain.THORChain, Chain.Maya];

const staticTokensMap = new Map<
  TokenNames | (string & {}),
  { tax?: TokenTax; decimal: number; identifier: string; logoURI?: string }
>();

const chainAddressIdentifierMap = new Map<string, string>();

const asyncTokenCache = new Map<string, { identifier: string; decimals: number; timestamp: number }>();
const CACHE_TTL = 3600000;

function getCachedTokenInfo(key: string) {
  const cached = asyncTokenCache.get(key);

  if (cached?.timestamp && Date.now() - cached.timestamp > CACHE_TTL) {
    asyncTokenCache.delete(key);
    return undefined;
  }

  return cached;
}

function setCachedTokenInfo(key: string, info: { identifier: string; decimals: number }) {
  if (asyncTokenCache.size > 1000) {
    const firstKey = asyncTokenCache.keys().next().value;
    if (firstKey) asyncTokenCache.delete(firstKey);
  }

  asyncTokenCache.set(key, { ...info, timestamp: Date.now() });
}

type ConditionalAssetValueReturn<T extends { asyncTokenLookup?: boolean }> = T["asyncTokenLookup"] extends true
  ? Promise<AssetValue>
  : AssetValue;

type AssetIdentifier =
  | { asset: CommonAssetString | TokenNames }
  | { asset: string }
  | { chain: Chain; address?: string };

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
    this.chainId = getChainConfig(assetInfo.chain).chainId;
  }

  toString({ includeSynthProtocol }: { includeSynthProtocol?: boolean } = {}) {
    return (this.isSynthetic || this.isTradeAsset) && !includeSynthProtocol
      ? this.symbol
      : `${this.chain}.${this.symbol}`;
  }

  toUrl() {
    if (this.isSynthetic) {
      return `${this.chain}.${this.symbol.replace(/\//g, ".")}`;
    }

    if (this.isTradeAsset) {
      return `${this.chain}.${this.symbol.replace(/~/g, "..")}`;
    }

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

    const chain = urlAsset.slice(0, firstDotIndex);
    const rest = urlAsset.slice(firstDotIndex + 1);

    const asset = match({ chain: chain as Chain, rest })
      .when(
        ({ rest }) => rest.includes(".."),
        ({ chain, rest }) => `${chain}.${rest.replace(/\.\./g, "~")}`,
      )
      .when(
        ({ chain, rest }) => TC_CHAINS.includes(chain) && rest.includes("."),
        ({ chain, rest }) => `${chain}.${rest.replace(/\./g, "/")}`,
      )
      .otherwise(({ chain, rest }) => `${chain}.${rest.replace(/__/g, ".")}`);

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

    const isChainAddressCombo = !assetOrChain.startsWith(Chain.Sui) && assetOrChain.includes(":");

    if (asyncTokenLookup && isChainAddressCombo) {
      const [chain, address] = assetOrChain.split(":") as [Chain, string];

      return createAsyncAssetValue({ address, chain, fromBaseDecimal, parsedValue }) as ConditionalAssetValueReturn<T>;
    }

    const fallbackIdentifier = isChainAddressCombo ? assetOrChain.split(":").join(".UNKNOWN-") : assetOrChain;

    const { identifier: unsafeIdentifier, decimal: commonAssetDecimal } = getCommonAssetInfo(
      fallbackIdentifier as CommonAssetString,
    );

    const { chain, isSynthetic, isTradeAsset, address } = getAssetInfo(unsafeIdentifier);
    const { baseDecimal } = getChainConfig(chain);

    const token = staticTokensMap.get(
      CASE_SENSITIVE_CHAINS.includes(chain)
        ? (unsafeIdentifier as TokenNames)
        : (unsafeIdentifier.toUpperCase() as TokenNames),
    );

    if (!token && asyncTokenLookup && !isSynthetic && !isTradeAsset) {
      return (async () => {
        const { ticker } = assetFromString(unsafeIdentifier);
        const tokenData = await fetchTokenData({ address, chain, ticker });
        return createAssetValue({
          decimal: tokenData.decimals,
          identifier: tokenData.identifier,
          value: fromBaseDecimal ? safeValue(BigInt(parsedValue), fromBaseDecimal) : parsedValue,
        });
      })() as ConditionalAssetValueReturn<T>;
    }

    const tokenDecimal = token?.decimal || commonAssetDecimal;

    warnOnce({
      condition: !tokenDecimal && !asyncTokenLookup,
      id: `assetValue_static_decimal_not_found_${chain}`,
      warning: `Couldn't find static decimal for one or more tokens on ${chain} (Using default ${baseDecimal} decimal as fallback).
This can result in incorrect calculations and mess with amount sent on transactions.
You can load static assets by installing @swapkit/tokens package and calling AssetValue.loadStaticAssets()
or by passing asyncTokenLookup: true to the from() function, which will make it async and return a promise.`,
    });

    const { decimal, identifier, tax } = token || {
      decimal: tokenDecimal || baseDecimal,
      identifier: unsafeIdentifier,
    };

    const adjustedValue = fromBaseDecimal
      ? safeValue(BigInt(parsedValue), fromBaseDecimal)
      : safeValue(parsedValue, decimal);

    const assetValue =
      isSynthetic || isTradeAsset
        ? createSyntheticAssetValue(identifier, adjustedValue)
        : createAssetValue({ decimal, identifier, tax, value: adjustedValue });

    return assetValue as ConditionalAssetValueReturn<T>;
  }

  static async loadStaticAssets(listNames?: TokenListName[]) {
    const { loadTokenLists } = await import("@swapkit/tokens");
    const lists = await loadTokenLists(listNames);

    for (const { tokens } of Object.values(lists)) {
      for (const { identifier, chain, ...rest } of tokens) {
        const chainConfig = getChainConfig(chain as Chain);

        const tokenKey = (
          CASE_SENSITIVE_CHAINS.includes(chainConfig.chain) ? identifier : identifier.toUpperCase()
        ) as TokenNames;
        const tokenDecimal = "decimals" in rest ? rest.decimals : chainConfig.baseDecimal;

        const tokenInfo = {
          decimal: tokenDecimal,
          identifier,
          logoURI: "logoURI" in rest ? (rest.logoURI as string) : undefined,
          tax: "tax" in rest ? (rest.tax as TokenTax) : undefined,
        };

        staticTokensMap.set(tokenKey, tokenInfo);

        // Also populate chain:address map for quick lookups
        if ("address" in rest && rest.address) {
          const lookupKey = CASE_SENSITIVE_CHAINS.includes(chainConfig.chain)
            ? `${chainConfig.chain}:${rest.address}`
            : `${chainConfig.chain}:${rest.address.toUpperCase()}`;
          chainAddressIdentifierMap.set(lookupKey, identifier);
        }
      }
    }

    return true;
  }

  static setStaticAssets(
    tokenMap: Map<
      string,
      { tax?: TokenTax; identifier: string; chain: Chain; address?: string } & (
        | { decimal: number }
        | { decimals: number }
      )
    >,
  ) {
    staticTokensMap.clear();
    chainAddressIdentifierMap.clear();

    for (const [key, value] of tokenMap.entries()) {
      const tokenKey = (
        CASE_SENSITIVE_CHAINS.includes(value.chain) ? value.identifier : value.identifier.toUpperCase()
      ) as TokenNames;
      const tokenDecimal = "decimals" in value ? value.decimals : value.decimal;
      const tokenInfo = { ...value, decimal: tokenDecimal, identifier: tokenKey };

      staticTokensMap.set(key, tokenInfo);

      if (value.address) {
        const lookupKey = CASE_SENSITIVE_CHAINS.includes(value.chain)
          ? `${value.chain}:${value.address}`
          : `${value.chain}:${value.address.toUpperCase()}`;
        chainAddressIdentifierMap.set(lookupKey, value.identifier);
      }
    }
    return true;
  }

  static get staticAssets() {
    return staticTokensMap;
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

async function fetchTokenData({ chain, address, ticker }: { chain: Chain; address?: string; ticker?: string }) {
  const isCaseSensitiveChain = CASE_SENSITIVE_CHAINS.includes(chain);

  const cacheKey = isCaseSensitiveChain
    ? `${chain}:${address || ticker}`
    : `${chain}:${address || ticker}`.toUpperCase();

  const cached = getCachedTokenInfo(cacheKey);
  if (cached) {
    return cached;
  }

  if (!address) {
    const { baseDecimal } = getChainConfig(chain);
    return { decimals: baseDecimal, identifier: `${chain}.${ticker || "UNKNOWN"}` };
  }

  const tokenInfo = await fetchTokenInfo({ address, chain });

  const identifier = `${chain}.${tokenInfo.ticker || ticker || "UNKNOWN"}-${address}`;

  warnOnce({
    condition: !!(!tokenInfo.ticker && ticker),
    id: `async_token_lookup_failed_${chain}_${address}`,
    warning: `Could not fetch token metadata for ${chain}:${address} from chain. Using user-provided ticker (${ticker}) with baseDecimal (${tokenInfo.decimals}).`,
  });

  // only cache if we got a proper ticker back
  tokenInfo.ticker && setCachedTokenInfo(cacheKey, { decimals: tokenInfo.decimals, identifier });

  return { decimals: tokenInfo.decimals, identifier };
}

function createAssetValue({
  identifier,
  decimal,
  value,
  tax,
}: {
  identifier: string;
  decimal: number;
  value: NumberPrimitives;
  tax?: TokenTax;
}) {
  validateIdentifier(identifier);
  return new AssetValue({ decimal, identifier, tax, value: safeValue(value, decimal) });
}

function createSyntheticAssetValue(identifier: string, value: NumberPrimitives = 0) {
  const chain = identifier.includes(".") ? (identifier.split(".")?.[0]?.toUpperCase() as Chain) : undefined;
  const isMayaOrThor = chain ? TC_CHAINS.includes(chain) : false;

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

async function createAsyncAssetValue({
  address,
  chain,
  fromBaseDecimal,
  parsedValue,
}: {
  address: string;
  chain: Chain;
  fromBaseDecimal?: number;
  parsedValue: NumberPrimitives;
}): Promise<AssetValue> {
  const { decimals, identifier } = await fetchTokenData({ address, chain });
  const value = fromBaseDecimal ? safeValue(BigInt(parsedValue), fromBaseDecimal) : parsedValue;
  return createAssetValue({ decimal: decimals, identifier, value });
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
  if (!AllChains.includes(chain.toUpperCase() as Chain)) {
    throw new SwapKitError({
      errorKey: "helpers_invalid_asset_identifier",
      info: { message: "Please use the AssetValue constructor for unsupported chains" },
    });
  }
}

function getAssetString(assetOrChain: AssetIdentifier) {
  validateAssetChain(assetOrChain);

  if ("chain" in assetOrChain) {
    const { chain, address } = assetOrChain;

    if (address) {
      const lookupKey = CASE_SENSITIVE_CHAINS.includes(chain as Chain)
        ? `${chain}:${address}`
        : `${chain}:${address.toUpperCase()}`;
      const identifier = chainAddressIdentifierMap.get(lookupKey);
      if (identifier) return identifier;
      return lookupKey;
    }

    return chain;
  }

  const { chain, symbol } = assetFromString(assetOrChain.asset);
  const isNativeChain = getAssetType({ chain, symbol }) === "Native";

  return isNativeChain ? chain : assetOrChain.asset;
}

function getSyntheticOrTradeAssetInfo(identifier: string, isSynthetic: boolean, isTradeAsset: boolean) {
  const splitIdentifier = identifier.split(".");
  const identifierChain = splitIdentifier[0]?.toUpperCase() as Chain;
  const isThorOrMaya = TC_CHAINS.includes(identifierChain);

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

  return { address, chain: identifierChain, isGasAsset: false, isSynthetic, isTradeAsset, symbol: finalSymbol, ticker };
}

function getNormalAssetInfo(identifier: string) {
  const firstDotIndex = identifier.indexOf(".");
  const chain = (firstDotIndex === -1 ? identifier : identifier.slice(0, firstDotIndex)).toUpperCase() as Chain;
  const assetSymbol = firstDotIndex === -1 ? identifier : identifier.slice(firstDotIndex + 1);

  const { address, ticker } = getAssetBaseInfo({ chain, symbol: assetSymbol });

  let formattedAddress: string | undefined;
  try {
    formattedAddress =
      address && EVMChains.includes(chain as EVMChain) && getAddress(address) ? getAddress(address) : address;
  } catch {
    formattedAddress = address;
  }

  const finalSymbol = formattedAddress ? `${ticker}-${formattedAddress}` : assetSymbol;

  return {
    address: formattedAddress,
    chain,
    isGasAsset: isGasAsset({ chain, symbol: assetSymbol }),
    isSynthetic: false,
    isTradeAsset: false,
    symbol: finalSymbol,
    ticker,
  };
}

function getAssetInfo(identifier: string) {
  const shortIdentifier = identifier.slice(0, 14);
  const isSynthetic = shortIdentifier.includes("/");
  const isTradeAsset = shortIdentifier.includes("~");

  if (isSynthetic || isTradeAsset) {
    return getSyntheticOrTradeAssetInfo(identifier, isSynthetic, isTradeAsset);
  }

  return getNormalAssetInfo(identifier);
}

function parseSymbolWithSeparator(symbol: string, useFirst = false) {
  const dashIndex = useFirst ? symbol.indexOf("-") : symbol.lastIndexOf("-");

  if (dashIndex === -1) {
    return { address: undefined, ticker: symbol };
  }

  const ticker = symbol.slice(0, dashIndex);
  const address = symbol.slice(dashIndex + 1);
  return { address, ticker };
}

function getAssetBaseInfo({ symbol, chain }: { symbol: string; chain: Chain }) {
  const { ticker, address } = parseSymbolWithSeparator(symbol, chain === Chain.Near);

  const finalAddress = address && !CASE_SENSITIVE_CHAINS.includes(chain) ? address.toLowerCase() : address;

  return { address: finalAddress, ticker };
}
