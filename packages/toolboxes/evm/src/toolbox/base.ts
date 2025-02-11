import {
  BaseDecimal,
  Chain,
  ChainId,
  ChainToExplorerUrl,
  type FeeOption,
  SKConfig,
} from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";

import { type EVMTxBaseParams, estimateTransactionFee, getBalance } from "../index";

import { EVMToolbox } from "./EVMToolbox";

const getNetworkParams = () => ({
  chainId: ChainId.BaseHex,
  chainName: "Base Mainnet",
  nativeCurrency: { name: "Ethereum", symbol: Chain.Ethereum, decimals: BaseDecimal.ETH },
  rpcUrls: [SKConfig.get("rpcUrls")[Chain.Base]],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Base]],
});

export const BASEToolbox = ({
  provider,
  signer,
}: { signer?: Signer; provider: JsonRpcProvider | BrowserProvider }) => {
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
    ) =>
      getBalance({ provider: overwriteProvider || provider, address, chain, potentialScamFilter }),
  };
};
