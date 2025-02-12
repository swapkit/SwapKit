import {
  BaseDecimal,
  Chain,
  ChainId,
  ChainToExplorerUrl,
  type FeeOption,
  SwapKitError,
  getRPCUrl,
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
  chainId: ChainId.BaseHex,
  chainName: "Base Mainnet",
  nativeCurrency: { name: "Ethereum", symbol: Chain.Ethereum, decimals: BaseDecimal.ETH },
  rpcUrls: [getRPCUrl(Chain.Base)],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Base]],
});

export const BASEToolbox = ({
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
        chain: Chain.Base,
      },
    });
  }

  const evmToolbox = EVMToolbox({ provider, signer });
  const chain = Chain.Base;

  return {
    ...evmToolbox,
    getNetworkParams,
    estimateTransactionFee: (txObject: EVMTxBaseParams, feeOptionKey: FeeOption) =>
      estimateTransactionFee(txObject, feeOptionKey, chain, provider),
    getBalance: async (
      address: string,
      potentialScamFilter = true,
      overwriteProvider?: JsonRpcProvider | BrowserProvider,
    ) => {
      const balance = await getBalance({
        provider: overwriteProvider || provider,
        api: api || covalentApi({ apiKey: apiKey as string, chainId: ChainId.Base }),
        address,
        chain,
        potentialScamFilter,
      });
      return balance;
    },
  };
};
