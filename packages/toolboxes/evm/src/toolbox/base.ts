import {
  BaseDecimal,
  Chain,
  ChainId,
  ChainToExplorerUrl,
  type FeeOption,
  getRPCUrl,
} from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";

import type { CovalentApiType } from "../api/covalentApi";
import { covalentApi } from "../api/covalentApi";
import { type EVMTxBaseParams, estimateTransactionFee, getBalance } from "../index";

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
  covalentApiKey,
}: {
  api?: CovalentApiType;
  covalentApiKey: string;
  signer?: Signer;
  provider: JsonRpcProvider | BrowserProvider;
}) => {
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
        api: api || covalentApi({ apiKey: covalentApiKey, chainId: ChainId.Base }),
        address,
        chain,
        potentialScamFilter,
      });
      return balance;
    },
  };
};
