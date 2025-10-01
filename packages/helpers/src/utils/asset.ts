import type { TokenNames } from "@swapkit/tokens";
import { Chain, type EVMChain, EVMChains, getChainConfig, UTXOChains } from "@swapkit/types";
import { match } from "ts-pattern";
import type { AssetValue } from "../modules/assetValue";
import { RequestClient } from "../modules/requestClient";
import type { RadixCoreStateResourceDTO } from "../types/radix";
import { getRPCUrl } from "./chains";

export type CommonAssetString = (typeof CommonAssetStrings)[number] | Chain;

export type ConditionalAssetValueReturn<T extends boolean> = T extends true ? Promise<AssetValue[]> : AssetValue[];

export const CommonAssetStrings = [
  `${Chain.Maya}.MAYA`,
  `${Chain.Maya}.CACAO`,
  `${Chain.Ethereum}.THOR`,
  `${Chain.Ethereum}.vTHOR`,
  `${Chain.Kujira}.USK`,
  `${Chain.Ethereum}.FLIP`,
  `${Chain.Radix}.XRD`,
] as const;

const ethGasChains = [Chain.Arbitrum, Chain.Aurora, Chain.Base, Chain.Ethereum, Chain.Optimism] as const;

async function getContractDecimals({ chain, to }: { chain: EVMChain; to: string }) {
  const getDecimalMethodHex = "0x313ce567";
  const { baseDecimal } = getChainConfig(chain);

  try {
    const rpcUrl = await getRPCUrl(chain);

    const { result } = await RequestClient.post<{ result: string }>(rpcUrl, {
      body: JSON.stringify({
        id: 44,
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ data: getDecimalMethodHex, to: to.toLowerCase() }, "latest"],
      }),
      headers: { accept: "*/*", "cache-control": "no-cache", "content-type": "application/json" },
    });

    return Number.parseInt(BigInt(result || baseDecimal).toString(), 10);
  } catch (error) {
    console.warn(`Failed to fetch contract decimals for ${to} on ${chain}:`, error);
    return baseDecimal;
  }
}

async function getRadixAssetDecimal(symbol: string) {
  const { baseDecimal } = getChainConfig(Chain.Radix);

  if (symbol === Chain.Radix) return baseDecimal;

  try {
    const resourceAddress = symbol.split("-")[1]?.toLowerCase();
    const rpcUrl = await getRPCUrl(Chain.Radix);

    const { manager } = await RequestClient.post<RadixCoreStateResourceDTO>(`${rpcUrl}/state/resource`, {
      body: JSON.stringify({ network: "mainnet", resource_address: resourceAddress }),
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });

    return manager.divisibility.value.divisibility;
  } catch (error) {
    console.warn(`Failed to fetch Radix asset decimal for ${symbol}:`, error);
    return baseDecimal;
  }
}

function callEVMContract(rpcUrl: string, address: string, methodHex: string, id: number) {
  return RequestClient.post<{ result: string }>(rpcUrl, {
    body: JSON.stringify({
      id,
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ data: methodHex, to: address.toLowerCase() }, "latest"],
    }),
    headers: { accept: "*/*", "cache-control": "no-cache", "content-type": "application/json" },
  });
}

function decodeABIString(hexResult: string): string {
  if (!hexResult || hexResult === "0x") return "UNKNOWN";

  try {
    const hexString = hexResult.slice(2);

    if (hexString.length > 64) {
      const lengthInBytes = Number.parseInt(hexString.slice(64, 128), 16);
      if (lengthInBytes > 0) {
        const symbolHex = hexString.slice(128, 128 + lengthInBytes * 2);
        return Buffer.from(symbolHex, "hex").toString("utf8");
      }
    } else if (hexString.length > 0) {
      return Buffer.from(hexString, "hex").toString("utf8").replace(/\0/g, "");
    }
  } catch (error) {
    console.warn(`Failed to decode ABI string from ${hexResult}: ${error}`);
  }

  return "UNKNOWN";
}

function decodeABIUint8(hexResult: string, fallback: number): number {
  if (!hexResult || hexResult === "0x") return fallback;

  try {
    return Number.parseInt(BigInt(hexResult).toString(), 10);
  } catch (error) {
    console.warn(`Failed to decode ABI uint8 from ${hexResult}: ${error}`);
    return fallback;
  }
}

async function getEVMAssetDecimal({ chain, symbol }: { chain: EVMChain; symbol: string }) {
  const { baseDecimal } = getChainConfig(chain);

  if (EVMChains.includes(symbol as EVMChain)) return baseDecimal;

  const splitSymbol = symbol.split("-");
  const address = splitSymbol.length === 1 ? undefined : splitSymbol[splitSymbol.length - 1]?.toLowerCase();

  const decimal = await (address?.startsWith("0x") ? getContractDecimals({ chain, to: address }) : baseDecimal);

  return decimal;
}

export function getDecimal({ chain, symbol }: { chain: Chain; symbol: string }) {
  const { baseDecimal } = getChainConfig(chain);

  return match(chain)
    .with(...EVMChains, (chain) => getEVMAssetDecimal({ chain, symbol }))
    .with(Chain.Radix, () => getRadixAssetDecimal(symbol))
    .otherwise(() => baseDecimal);
}

export function getTokenInfoFromChain({ chain, address }: { chain: Chain; address: string }) {
  const { baseDecimal } = getChainConfig(chain);

  return match(chain)
    .when(
      (c) => EVMChains.includes(c as EVMChain),
      async () => {
        try {
          const { isAddress, getAddress } = await import("ethers");

          if (!isAddress(getAddress(address.replace(/^0X/, "0x")))) {
            return { decimals: baseDecimal, symbol: "UNKNOWN" };
          }

          const rpcUrl = await getRPCUrl(chain as EVMChain);

          const [symbolResult, decimalsResult] = await Promise.all([
            callEVMContract(rpcUrl, address, "0x95d89b41", 1).catch((error: Error) => {
              console.warn(`Could not fetch symbol for ${address} on ${chain}: ${error.message}`);
              return { result: "" };
            }),
            callEVMContract(rpcUrl, address, "0x313ce567", 2).catch((error: Error) => {
              console.warn(`Could not fetch decimals for ${address} on ${chain}: ${error.message}`);
              return { result: "" };
            }),
          ]);

          const symbol = decodeABIString(symbolResult.result);
          const decimals = decodeABIUint8(decimalsResult.result, baseDecimal);

          return { decimals, symbol };
        } catch (error) {
          console.warn(`Failed to fetch token info for ${address} on ${chain}:`, error);
          return { decimals: baseDecimal, symbol: "UNKNOWN" };
        }
      },
    )
    .with(Chain.Solana, async () => {
      if (!address) return { decimals: baseDecimal, symbol: "UNKNOWN" };

      try {
        const response = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${address}`);
        if (response.ok) {
          const data = await response.json();
          const token = Array.isArray(data) ? data[0] : data;
          if (token) {
            return { decimals: token.decimals ?? baseDecimal, symbol: token.symbol || "UNKNOWN" };
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch Solana token info for ${address}:`, error);
      }
      return { decimals: baseDecimal, symbol: "UNKNOWN" };
    })
    .with(Chain.Tron, async () => {
      if (!address) return { decimals: baseDecimal, symbol: "UNKNOWN" };

      try {
        const { TronWeb } = await import("tronweb");
        const rpcUrl = await getRPCUrl(Chain.Tron);
        const tronWeb = new TronWeb({
          fullHost: rpcUrl,
          // Set a default address for read-only calls (required by TronWeb)
          privateKey: "0000000000000000000000000000000000000000000000000000000000000001",
        });

        const contract = await tronWeb.contract().at(address);

        const [symbolResult, decimalsResult] = await Promise.all([
          contract
            .symbol()
            .call()
            .catch((error: Error) => {
              console.warn(`Could not fetch symbol for ${address} on Tron:`, error);
              return undefined;
            }),
          contract
            .decimals()
            .call()
            .catch((error: Error) => {
              console.warn(`Could not fetch decimals for ${address} on Tron:`, error);
              return baseDecimal;
            }),
        ]);

        return {
          decimals: typeof decimalsResult === "number" ? decimalsResult : Number(decimalsResult || baseDecimal),
          symbol: symbolResult || "UNKNOWN",
        };
      } catch (error) {
        console.warn(`Failed to fetch Tron token info for ${address}:`, error);
        return { decimals: baseDecimal, symbol: "UNKNOWN" };
      }
    })
    .with(Chain.Near, async () => {
      if (!address) return { decimals: baseDecimal, symbol: "UNKNOWN" };

      try {
        const { providers } = await import("near-api-js");
        const rpcUrl = await getRPCUrl(Chain.Near);
        const provider = new providers.JsonRpcProvider({ url: rpcUrl });

        const metadata = await provider.query({
          account_id: address,
          args_base64: Buffer.from("{}").toString("base64"),
          finality: "final",
          method_name: "ft_metadata",
          request_type: "call_function",
        });

        const result = JSON.parse(Buffer.from((metadata as any).result).toString());

        return { decimals: result?.decimals || baseDecimal, symbol: result?.symbol || "UNKNOWN" };
      } catch (error) {
        console.warn(`Failed to fetch Near token info for ${address}:`, error);
        return { decimals: baseDecimal, symbol: "UNKNOWN" };
      }
    })
    .otherwise(async () => ({ decimals: baseDecimal, symbol: "UNKNOWN" }));
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
  const { baseDecimal: decimal } = getChainConfig(assetString as Chain);

  const commonAssetInfo = match(assetString.toUpperCase())
    .with(...ethGasChains, (asset) => ({ decimal, identifier: `${asset}.ETH` }))
    .with(Chain.THORChain, (asset) => ({ decimal, identifier: `${asset}.RUNE` }))
    .with(Chain.Cosmos, (asset) => ({ decimal, identifier: `${asset}.ATOM` }))
    .with(Chain.Maya, (asset) => ({ decimal: 10, identifier: `${asset}.CACAO` }))
    .with(Chain.BinanceSmartChain, (asset) => ({ decimal, identifier: `${asset}.BNB` }))
    .with(Chain.Avalanche, (asset) => ({ decimal, identifier: `${asset}.AVAX` }))
    .with(Chain.Gnosis, (asset) => ({ decimal, identifier: `${asset}.XDAI` }))
    .with(Chain.Berachain, (asset) => ({ decimal, identifier: `${asset}.BERA` }))
    .with(Chain.Tron, (asset) => ({ decimal, identifier: `${asset}.TRX` }))
    .with(
      Chain.Solana,
      Chain.Chainflip,
      Chain.Kujira,
      Chain.Ripple,
      Chain.Polkadot,
      Chain.Near,
      ...UTXOChains,
      (asset) => ({ decimal, identifier: `${asset}.${asset}` }),
    )
    .with(Chain.Radix, "XRD.XRD", () => ({ decimal, identifier: "XRD.XRD" }))
    .with(Chain.Polygon, "POL.POL", () => ({ decimal, identifier: "POL.POL" }))
    .with("KUJI.USK", (asset) => ({ decimal: 6, identifier: asset }))
    .with("ETH.FLIP", () => ({
      decimal: getChainConfig(Chain.Ethereum).baseDecimal,
      identifier: "ETH.FLIP-0x826180541412D574cf1336d22c0C0a287822678A",
    }))
    .with("ETH.THOR", () => ({
      decimal: getChainConfig(Chain.Ethereum).baseDecimal,
      identifier: "ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
    }))
    .with("ETH.vTHOR", () => ({
      decimal: getChainConfig(Chain.Ethereum).baseDecimal,
      identifier: "ETH.vTHOR-0x815c23eca83261b6ec689b60cc4a58b54bc24d8d",
    }))
    .with("MAYA.CACAO", (identifier) => ({ decimal: 10, identifier }))
    .with("MAYA.MAYA", (identifier) => ({ decimal: 4, identifier }))
    // Just to be sure that we are not missing any chain
    .otherwise(() => ({ decimal, identifier: assetString }));

  return commonAssetInfo;
};

export function getAssetType({ chain, symbol }: { chain: Chain; symbol: string }) {
  if (symbol.includes("/")) return "Synth";
  if (symbol.includes("~")) return "Trade";

  const isNative = match(chain)
    .with(Chain.Radix, () => symbol === Chain.Radix || `${chain}.${symbol}` === getCommonAssetInfo(chain).identifier)
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

  return { chain, symbol, synth, ticker };
};

export async function findAssetBy(params: { chain: Chain; contract: string } | { identifier: `${Chain}.${string}` }) {
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
