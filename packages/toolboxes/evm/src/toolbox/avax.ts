import { BaseDecimal, Chain, ChainId, ChainToExplorerUrl, type FeeOption } from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";

import { type EVMTxBaseParams, estimateTransactionFee, getBalance } from "../index";

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
  provider,
  signer,
}: { signer?: Signer; provider: JsonRpcProvider | BrowserProvider }) => {
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
      getBalance({ provider: overwriteProvider || provider, address, chain, potentialScamFilter }),
  };
};
