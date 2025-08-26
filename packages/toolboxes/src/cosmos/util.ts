import type { OfflineSigner } from "@cosmjs/proto-signing";
import type { SigningStargateClientOptions } from "@cosmjs/stargate";
import { AssetValue, Chain, type CosmosChain, getChainConfig, getRPCUrl, SwapKitError } from "@swapkit/helpers";
import type { CosmosCreateTransactionParams } from "./types";

export const USK_KUJIRA_FACTORY_DENOM =
  "FACTORY/KUJIRA1QK00H5ATUTPSV900X202PXX42NPJR9THG58DNQPA72F2P7M2LUASE444A7/UUSK";

export const YUM_KUJIRA_FACTORY_DENOM = "FACTORY/KUJIRA1YGFXN0ER40KLCNCK8THLTUPRDXLCK6WVNPKF2K/UYUM";

export const DEFAULT_COSMOS_FEE_MAINNET = { amount: [{ amount: "500", denom: "uatom" }], gas: "200000" };

export const DEFAULT_KUJI_FEE_MAINNET = { amount: [{ amount: "1000", denom: "ukuji" }], gas: "200000" };

export const DEFAULT_NOBLE_FEE_MAINNET = { amount: [{ amount: "1000", denom: "uusdc" }], gas: "200000" };

export function getDefaultChainFee(chain: CosmosChain) {
  switch (chain) {
    case Chain.Maya:
      return { amount: [], gas: "10000000000" };
    case Chain.THORChain:
      return { amount: [], gas: "500000000" };
    case Chain.Kujira:
      return DEFAULT_KUJI_FEE_MAINNET;
    case Chain.Noble:
      return DEFAULT_NOBLE_FEE_MAINNET;
    default:
      return DEFAULT_COSMOS_FEE_MAINNET;
  }
}

export const getMsgSendDenom = (symbol: string, isThorchain = false) => {
  if (isThorchain) {
    return symbol.toLowerCase();
  }

  switch (symbol) {
    case "uUSK":
    case "USK":
      return USK_KUJIRA_FACTORY_DENOM;
    case "uYUM":
    case "YUM":
      return YUM_KUJIRA_FACTORY_DENOM;
    case "uKUJI":
    case "KUJI":
      return "ukuji";
    case "ATOM":
    case "uATOM":
      return "uatom";
    case "uUSDC":
    case "USDC":
      return "uusdc";
    default:
      return symbol;
  }
};

export const getDenomWithChain = ({ symbol, chain }: AssetValue) => {
  if (chain === Chain.Maya) {
    return (symbol.toUpperCase() !== "CACAO" ? symbol : `${Chain.Maya}.${symbol}`).toUpperCase();
  }
  if (chain === Chain.THORChain) {
    return (
      ["RUNE", "TCY", "RUJI"].includes(symbol.toUpperCase()) ? `${Chain.THORChain}.${symbol}` : symbol
    ).toUpperCase();
  }
  return getMsgSendDenom(symbol, false);
};

export async function createStargateClient(url: string) {
  const imported = await import("@cosmjs/stargate");

  const StargateClient = imported.StargateClient ?? imported.default?.StargateClient;

  const defaultRequestHeaders =
    typeof window !== "undefined"
      ? ({} as Record<string, string>)
      : { referer: "https://sdk.swapkit.dev", referrer: "https://sdk.swapkit.dev" };

  return StargateClient.connect({ headers: defaultRequestHeaders, url });
}

export async function createSigningStargateClient(
  url: string,
  signer: OfflineSigner,
  optionsOrBaseGas: string | SigningStargateClientOptions = {},
) {
  const imported = await import("@cosmjs/stargate");
  const SigningStargateClient = imported.SigningStargateClient ?? imported.default?.SigningStargateClient;
  const GasPrice = imported.GasPrice ?? imported.default?.GasPrice;
  const gasPrice = typeof optionsOrBaseGas === "string" ? optionsOrBaseGas : "0.0003uatom";
  const options = typeof optionsOrBaseGas === "string" ? {} : optionsOrBaseGas;

  return SigningStargateClient.connectWithSigner(url, signer, { gasPrice: GasPrice.fromString(gasPrice), ...options });
}

export async function createOfflineStargateClient(wallet: OfflineSigner, registry?: SigningStargateClientOptions) {
  const imported = await import("@cosmjs/stargate");
  const SigningStargateClient = imported.SigningStargateClient ?? imported.default?.SigningStargateClient;
  return SigningStargateClient.offline(wallet, registry);
}

const getTransferMsgTypeByChain = (chain: CosmosChain) => {
  switch (chain) {
    case Chain.Maya:
    case Chain.THORChain:
      return "/types.MsgSend";
    case Chain.Cosmos:
    case Chain.Kujira:
    case Chain.Noble:
      return "/cosmos.bank.v1beta1.MsgSend";
    default:
      throw new SwapKitError("toolbox_cosmos_not_supported", { chain });
  }
};

/**
 * Used to build tx for Cosmos and Kujira
 */
export async function cosmosCreateTransaction({
  sender,
  recipient,
  assetValue,
  memo = "",
  feeRate,
  sequence,
  accountNumber,
}: CosmosCreateTransactionParams) {
  const { chain, chainId } = assetValue;

  const rpcUrl = await getRPCUrl(chain);
  const client = await createStargateClient(rpcUrl);
  const accountOnChain = await client.getAccount(sender);

  if (!accountOnChain) {
    throw new SwapKitError("toolbox_cosmos_account_not_found", { sender });
  }

  const gasAsset = AssetValue.from({ chain });
  const feeAsset = getMsgSendDenom(gasAsset.symbol);
  const defaultFee = getDefaultChainFee(chain as CosmosChain);

  const txFee =
    feeAsset && feeRate
      ? { amount: [{ amount: feeRate.toString(), denom: feeAsset }], gas: defaultFee.gas }
      : defaultFee;

  const msgSend = {
    amount: [{ amount: assetValue.getBaseValue("string"), denom: getMsgSendDenom(assetValue.symbol) }],
    fromAddress: sender,
    toAddress: recipient,
  };

  return {
    accountNumber: accountNumber ?? accountOnChain.accountNumber,
    chainId,
    fee: txFee,
    memo,
    msgs: [{ typeUrl: getTransferMsgTypeByChain(chain as CosmosChain), value: msgSend }],
    sequence: sequence ?? accountOnChain.sequence,
  };
}

// Map of known denoms to their asset configurations
const DENOM_MAP = {
  atom: { chain: Chain.Cosmos, decimals: getChainConfig(Chain.Cosmos).baseDecimal },

  // Maya denoms
  cacao: { chain: Chain.Maya, decimals: 10 }, // Maya uses 10 decimals for CACAO
  kuji: { chain: Chain.Kujira, decimals: getChainConfig(Chain.Kujira).baseDecimal },
  maya: { asset: `${Chain.Maya}.${Chain.Maya}`, decimals: 4 }, // MAYA token uses 4 decimals
  // THORChain denoms
  rune: { chain: Chain.THORChain, decimals: getChainConfig(Chain.THORChain).baseDecimal },
  tcy: { asset: "THOR.TCY", decimals: getChainConfig(Chain.THORChain).baseDecimal },

  // Cosmos denoms
  uatom: { chain: Chain.Cosmos, decimals: getChainConfig(Chain.Cosmos).baseDecimal },

  // Kujira denoms
  ukuji: { chain: Chain.Kujira, decimals: getChainConfig(Chain.Kujira).baseDecimal },
  usdc: { chain: Chain.Noble, decimals: getChainConfig(Chain.Noble).baseDecimal },

  // Noble denoms
  uusdc: { chain: Chain.Noble, decimals: getChainConfig(Chain.Noble).baseDecimal },
  "x/kuji": { asset: "THOR.KUJI", decimals: getChainConfig(Chain.THORChain).baseDecimal },

  // USK on Kujira (lowercase version of the factory denom)
  [USK_KUJIRA_FACTORY_DENOM.toLowerCase()]: {
    asset: `${Chain.Kujira}.USK`,
    decimals: getChainConfig(Chain.Kujira).baseDecimal,
  },
};

/**
 * Converts a Cosmos denom and amount to an AssetValue with proper decimal handling
 * @param denom - The denomination string
 * @param amount - The amount in base units as a string
 * @returns AssetValue with the correct decimal conversion
 */
export const getAssetFromDenom = (denom: string, amount: string) => {
  const config = DENOM_MAP[denom.toLowerCase()];

  if (!config) {
    // For unknown denoms, default to 8 decimals (common for many Cosmos chains)
    // This preserves the original behavior while using fromBaseDecimal
    return AssetValue.from({ asset: denom, fromBaseDecimal: 8, value: amount });
  }

  const { chain, asset, decimals } = config;

  const assetOrChain = (chain ? { chain } : { asset }) as { asset: string } | { chain: CosmosChain };

  return AssetValue.from({ ...assetOrChain, fromBaseDecimal: decimals, value: amount });
};
