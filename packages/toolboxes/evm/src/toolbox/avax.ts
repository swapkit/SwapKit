import {
  BaseDecimal,
  Chain,
  ChainId,
  ChainToExplorerUrl,
  type FeeOption,
  SwapKitError,
} from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";

import {
  type AlchemyApiType,
  type CovalentApiType,
  type EVMTxBaseParams,
  covalentApi,
  estimateTransactionFee,
  getBalance,
} from "../index";

import { EVMToolbox } from "./EVMToolbox";

const getNetworkParams = () => ({
  chainId: ChainId.AvalancheHex,
  chainName: "Avalanche Network",
  nativeCurrency: { name: "Avalanche", symbol: Chain.Avalanche, decimals: BaseDecimal.AVAX },
  // Use external rpc URL so wallets don't throw warning to user
  rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Avalanche]],
});

export const AVAXToolbox = ({
  api,
  provider,
  signer,
  apiKey,
}: {
  api?: CovalentApiType | AlchemyApiType;
  apiKey?: string;
  signer?: Signer;
  provider: JsonRpcProvider | BrowserProvider;
}) => {
  if (!(api || apiKey)) {
    throw new SwapKitError({
      errorKey: "wallet_missing_api_key",
      info: {
        chain: Chain.Avalanche,
      },
    });
  }

  const avaxApi = api || covalentApi({ apiKey: apiKey as string, chainId: ChainId.Avalanche });
  const evmToolbox = EVMToolbox({ provider, signer });
  const chain = Chain.Avalanche;

  return {
    ...evmToolbox,
    getNetworkParams,
    estimateTransactionFee: (txObject: EVMTxBaseParams, feeOptionKey: FeeOption) =>
      estimateTransactionFee(txObject, feeOptionKey, chain, provider),
    getBalance: (
      address: string,
      potentialScamFilter = true,
      overwriteProvider?: JsonRpcProvider | BrowserProvider,
    ) =>
      getBalance({
        provider: overwriteProvider || provider,
        api: avaxApi,
        address,
        chain,
        potentialScamFilter,
      }),
  };
};
