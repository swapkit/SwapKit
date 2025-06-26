import type { OfflineSigner } from "@cosmjs/proto-signing";
import type { SigningStargateClientOptions } from "@cosmjs/stargate";
import {
  AssetValue,
  BaseDecimal,
  Chain,
  ChainId,
  type CosmosChain,
  SKConfig,
  SwapKitError,
} from "@swapkit/helpers";

import type { CosmosCreateTransactionParams } from "./thorchainUtils";

export const USK_KUJIRA_FACTORY_DENOM =
  "FACTORY/KUJIRA1QK00H5ATUTPSV900X202PXX42NPJR9THG58DNQPA72F2P7M2LUASE444A7/UUSK";

export const YUM_KUJIRA_FACTORY_DENOM =
  "FACTORY/KUJIRA1YGFXN0ER40KLCNCK8THLTUPRDXLCK6WVNPKF2K/UYUM";

export const DEFAULT_COSMOS_FEE_MAINNET = {
  amount: [{ denom: "uatom", amount: "500" }],
  gas: "200000",
};

export const DEFAULT_KUJI_FEE_MAINNET = {
  amount: [{ denom: "ukuji", amount: "1000" }],
  gas: "200000",
};

export function getDefaultChainFee(chain: CosmosChain) {
  switch (chain) {
    case Chain.Maya:
      return { amount: [], gas: "10000000000" };
    case Chain.THORChain:
      return { amount: [], gas: "500000000" };
    case Chain.Kujira:
      return DEFAULT_KUJI_FEE_MAINNET;
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
      symbol.toUpperCase() !== "RUNE" ? symbol : `${Chain.THORChain}.${symbol}`
    ).toUpperCase();
  }
  return getMsgSendDenom(symbol, false);
};

export async function createStargateClient(url: string) {
  const { StargateClient } = await import("@cosmjs/stargate");

  return StargateClient.connect(url);
}

export async function createSigningStargateClient(
  url: string,
  signer: any,
  optionsOrBaseGas: string | SigningStargateClientOptions = {},
) {
  const { SigningStargateClient, GasPrice } = await import("@cosmjs/stargate");
  const gasPrice = typeof optionsOrBaseGas === "string" ? optionsOrBaseGas : "0.0003uatom";
  const options = typeof optionsOrBaseGas === "string" ? {} : optionsOrBaseGas;

  return SigningStargateClient.connectWithSigner(url, signer, {
    gasPrice: GasPrice.fromString(gasPrice),
    ...options,
  });
}

export async function createOfflineStargateClient(
  wallet: OfflineSigner,
  registry?: SigningStargateClientOptions,
) {
  const { SigningStargateClient } = await import("@cosmjs/stargate");

  return SigningStargateClient.offline(wallet, registry);
}

export const getRPC = (chainId: ChainId) => {
  const { isStagenet } = SKConfig.get("envs");
  const rpcUrls = SKConfig.get("rpcUrls");

  switch (chainId) {
    case ChainId.Kujira:
      return rpcUrls.KUJI;

    case ChainId.THORChain:
    case "thorchain-mainnet-v1" as ChainId:
      return isStagenet ? rpcUrls.THOR_STAGENET : rpcUrls.THOR;
    case ChainId.Maya:
      return isStagenet ? rpcUrls.MAYA_STAGENET : rpcUrls.MAYA;

    default:
      return rpcUrls.GAIA;
  }
};

const getTransferMsgTypeByChain = (chain: CosmosChain) => {
  switch (chain) {
    case Chain.Maya:
    case Chain.THORChain:
      return "/types.MsgSend";
    case Chain.Cosmos:
    case Chain.Kujira:
      return "/cosmos.bank.v1beta1.MsgSend";
    default:
      throw new SwapKitError("toolbox_cosmos_not_supported", { chain });
  }
};

/**
 * Used to build tx for Cosmos and Kujira
 */
export const cosmosCreateTransaction = async ({
  sender,
  recipient,
  assetValue,
  memo = "",
  feeRate,
  sequence,
  accountNumber,
}: CosmosCreateTransactionParams) => {
  const { chain, chainId } = assetValue;

  const url = getRPC(chainId);
  const client = await createStargateClient(url);
  const accountOnChain = await client.getAccount(sender);

  if (!accountOnChain) {
    throw new SwapKitError("toolbox_cosmos_account_not_found", { sender });
  }

  const gasAsset = AssetValue.from({ chain });
  const feeAsset = getMsgSendDenom(gasAsset.symbol);
  const defaultFee = getDefaultChainFee(chain as CosmosChain);

  const txFee =
    feeAsset && feeRate
      ? { amount: [{ denom: feeAsset, amount: feeRate.toString() }], gas: defaultFee.gas }
      : defaultFee;

  const msgSend = {
    fromAddress: sender,
    toAddress: recipient,
    amount: [
      { amount: assetValue.getBaseValue("string"), denom: getMsgSendDenom(assetValue.symbol) },
    ],
  };

  return {
    accountNumber: accountNumber ?? accountOnChain.accountNumber,
    chainId,
    fee: txFee,
    memo,
    sequence: sequence ?? accountOnChain.sequence,
    msgs: [{ typeUrl: getTransferMsgTypeByChain(chain as CosmosChain), value: msgSend }],
  };
};

// Map of known denoms to their asset configurations
const DENOM_MAP = {
  // THORChain denoms
  rune: { chain: Chain.THORChain, decimals: BaseDecimal[Chain.THORChain] },
  tcy: { asset: "THOR.TCY", decimals: BaseDecimal[Chain.THORChain] },
  "x/kuji": { asset: "THOR.KUJI", decimals: BaseDecimal[Chain.THORChain] },

  // Cosmos denoms
  uatom: { chain: Chain.Cosmos, decimals: BaseDecimal[Chain.Cosmos] },
  atom: { chain: Chain.Cosmos, decimals: BaseDecimal[Chain.Cosmos] },

  // Maya denoms
  cacao: { chain: Chain.Maya, decimals: 10 }, // Maya uses 10 decimals for CACAO
  maya: { asset: `${Chain.Maya}.${Chain.Maya}`, decimals: 4 }, // MAYA token uses 4 decimals

  // Kujira denoms
  ukuji: { chain: Chain.Kujira, decimals: BaseDecimal[Chain.Kujira] },
  kuji: { chain: Chain.Kujira, decimals: BaseDecimal[Chain.Kujira] },

  // USK on Kujira (lowercase version of the factory denom)
  [USK_KUJIRA_FACTORY_DENOM.toLowerCase()]: {
    asset: `${Chain.Kujira}.USK`,
    decimals: BaseDecimal[Chain.Kujira],
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
    return AssetValue.from({
      asset: denom,
      value: amount,
      fromBaseDecimal: 8,
    });
  }

  const { chain, asset, decimals } = config;

  const assetOrChain = (
    chain
      ? {
          chain,
        }
      : { asset }
  ) as { asset: string } | { chain: CosmosChain };

  return AssetValue.from({
    ...assetOrChain,
    value: amount,
    fromBaseDecimal: decimals,
  });
};
