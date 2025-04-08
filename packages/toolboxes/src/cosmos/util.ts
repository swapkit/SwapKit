import type { OfflineSigner } from "@cosmjs/proto-signing";
import type { SigningStargateClientOptions } from "@cosmjs/stargate";
import { AssetValue, Chain, ChainId, type CosmosChain, SKConfig } from "@swapkit/helpers";

import type { CosmosNativeTransferTxParams } from "./thorchainUtils";

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
      throw new Error("Unsupported chain");
  }
};

/**
 * Used to build tx for Cosmos and Kujira
 */
export const buildNativeTransferTx = async ({
  fromAddress,
  toAddress,
  assetValue,
  memo = "",
  fee,
}: CosmosNativeTransferTxParams) => {
  const { chain, chainId } = assetValue;

  const url = getRPC(chainId);
  const client = await createStargateClient(url);
  const accountOnChain = await client.getAccount(fromAddress);

  if (!accountOnChain) {
    throw new Error("Account does not exist");
  }

  const gasAsset = AssetValue.from({ chain });
  const feeAsset = getMsgSendDenom(gasAsset.symbol);
  const defaultFee = getDefaultChainFee(chain as CosmosChain);

  const txFee =
    feeAsset && fee
      ? { amount: [{ denom: feeAsset, amount: fee }], gas: defaultFee.gas }
      : defaultFee;

  const msgSend = {
    fromAddress,
    toAddress,
    amount: [
      { amount: assetValue.getBaseValue("string"), denom: getMsgSendDenom(assetValue.symbol) },
    ],
  };

  return {
    accountNumber: accountOnChain.accountNumber,
    chainId,
    fee: txFee,
    memo,
    sequence: accountOnChain.sequence,
    msgs: [{ typeUrl: getTransferMsgTypeByChain(chain as CosmosChain), value: msgSend }],
  };
};
