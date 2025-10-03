import type { TokenNames } from "@swapkit/tokens";
import { Chain, type EVMChain, EVMChains, getChainConfig, UTXOChains } from "@swapkit/types";
import { match } from "ts-pattern";
import type { AssetValue } from "../modules/assetValue";
import { RequestClient } from "../modules/requestClient";
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

type RadixResourceResponse = {
  at_ledger_state?: any;
  manager: {
    resource_type: string;
    divisibility: { substate_type: string; is_locked: boolean; value: { divisibility: number } };
  };
  owner_role?: any;
};
const ethGasChains = [Chain.Arbitrum, Chain.Aurora, Chain.Base, Chain.Ethereum, Chain.Optimism] as const;

async function getRadixAssetDecimals(address: string) {
  const { baseDecimal } = getChainConfig(Chain.Radix);

  try {
    const rpcUrl = await getRPCUrl(Chain.Radix);

    const { manager } = await RequestClient.post<RadixResourceResponse>(`${rpcUrl}/state/resource`, {
      body: JSON.stringify({ network: "mainnet", resource_address: address }),
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });

    return manager?.divisibility?.value?.divisibility;
  } catch (error) {
    console.warn(`Failed to fetch Radix asset decimals for ${address}:`, error);
    return baseDecimal;
  }
}

async function getRadixAssetTicker(address: string) {
  try {
    const rpcUrl = await getRPCUrl(Chain.Radix);

    const response = await RequestClient.post<{
      items: Array<{
        address: string;
        explicit_metadata?: { items: Array<{ key: string; value: { typed: { value: string; type: string } } }> };
      }>;
    }>(`${rpcUrl}/state/entity/details`, {
      body: JSON.stringify({ addresses: [address], opt_ins: { explicit_metadata: ["symbol"] } }),
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });

    const symbolMetadata = response.items[0]?.explicit_metadata?.items.find((item) => item.key === "symbol");
    return symbolMetadata?.value.typed.value || undefined;
  } catch (error) {
    console.warn(`Failed to fetch Radix asset symbol for ${address}:`, error);
    return undefined;
  }
}

async function callEVMContract({
  chain,
  address,
  methodHex,
  id,
}: {
  chain: EVMChain;
  address: string;
  methodHex: string;
  id: number;
}) {
  const rpcUrl = await getRPCUrl(chain);
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

async function decodeABIString(hexResult: string) {
  if (!hexResult || hexResult === "0x") return "UNKNOWN";

  try {
    const { AbiCoder } = await import("ethers");
    const abiCoder = AbiCoder.defaultAbiCoder();
    const decoded = abiCoder.decode(["string"], hexResult);
    return decoded[0].trim();
  } catch (error) {
    console.warn(`Failed to decode ABI string from ${hexResult}: ${error}`);
    return "UNKNOWN";
  }
}

function decodeABIUint8(hexResult: string, fallback: number) {
  if (!hexResult || hexResult === "0x") return fallback;

  try {
    return Number(hexResult);
  } catch (error) {
    console.warn(`Failed to decode ABI uint8 from ${hexResult}: ${error}`);
    return fallback;
  }
}

async function getEVMAssetDecimals({ chain, address }: { chain: EVMChain; address: string }) {
  const { baseDecimal } = getChainConfig(chain);

  const formattedAddress = address.toLowerCase();

  if (address === "" || !formattedAddress.startsWith("0x")) return baseDecimal;

  const decimalResponse = await callEVMContract({ address, chain, id: 2, methodHex: "0x313ce567" }).catch(
    (error: Error) => {
      console.warn(`Could not fetch decimals for ${address} on ${chain}: ${error.message}`);
      return { result: "" };
    },
  );

  const decimals = decodeABIUint8(decimalResponse.result, baseDecimal);
  return decimals;
}

async function getEVMAssetTicker({ chain, address }: { chain: EVMChain; address: string }) {
  const formattedAddress = address.toLowerCase();

  if (formattedAddress === "" || !formattedAddress.startsWith("0x")) return undefined;

  const tickerResponse = await callEVMContract({ address, chain, id: 1, methodHex: "0x95d89b41" }).catch(
    (error: Error) => {
      console.warn(`Could not fetch symbol for ${address} on ${chain}: ${error.message}`);
      return { result: "" };
    },
  );

  const ticker = await decodeABIString(tickerResponse.result);

  return ticker;
}

export function fetchTokenInfo({ chain, address }: { chain: Chain; address: string }) {
  const { baseDecimal } = getChainConfig(chain);

  return match(chain)
    .with(...EVMChains, async () => {
      try {
        const { isAddress, getAddress } = await import("ethers");

        if (!isAddress(getAddress(address.replace(/^0X/, "0x")))) {
          return { decimals: baseDecimal, ticker: undefined };
        }

        const [ticker, decimals] = await Promise.all([
          getEVMAssetTicker({ address, chain: chain as EVMChain }),
          getEVMAssetDecimals({ address, chain: chain as EVMChain }),
        ]);

        return { decimals, ticker };
      } catch (error) {
        console.warn(`Failed to fetch token info for ${address} on ${chain}:`, error);
        return { decimals: baseDecimal, ticker: undefined };
      }
    })
    .with(Chain.Solana, async () => {
      if (!address) return { decimals: baseDecimal, ticker: undefined };

      try {
        const response = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${address}`);
        if (response.ok) {
          const data = await response.json();
          const token = Array.isArray(data) ? data[0] : data;
          if (token) {
            return { decimals: token.decimals ?? baseDecimal, ticker: token.symbol || undefined };
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch Solana token info for ${address}:`, error);
      }
      return { decimals: baseDecimal, ticker: undefined };
    })
    .with(Chain.Tron, async () => {
      if (!address) return { decimals: baseDecimal, ticker: undefined };

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
          ticker: symbolResult || undefined,
        };
      } catch (error) {
        console.warn(`Failed to fetch Tron token info for ${address}:`, error);
        return { decimals: baseDecimal, ticker: undefined };
      }
    })
    .with(Chain.Near, async () => {
      if (!address) return { decimals: baseDecimal, ticker: "UNKNOWN" };

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

        return { decimals: result?.decimals || baseDecimal, ticker: result?.symbol };
      } catch (error) {
        console.warn(`Failed to fetch Near token info for ${address}:`, error);
        return { decimals: baseDecimal, ticker: undefined };
      }
    })
    .with(Chain.Radix, async () => {
      if (!address) return { decimals: baseDecimal, ticker: undefined };

      try {
        const [ticker, decimals] = await Promise.all([getRadixAssetTicker(address), getRadixAssetDecimals(address)]);

        return { decimals, ticker };
      } catch (error) {
        console.warn(`Failed to fetch Radix token info for ${address}:`, error);
        return { decimals: baseDecimal, ticker: undefined };
      }
    })
    .otherwise(async () => ({ decimals: baseDecimal, ticker: undefined }));
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
