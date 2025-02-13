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
  chainId: ChainId.PolygonHex,
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "Polygon", symbol: Chain.Polygon, decimals: BaseDecimal.MATIC },
  rpcUrls: [SKConfig.get("rpcUrls")[Chain.Polygon]],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Polygon]],
});

export const MATICToolbox = ({
  provider,
  signer,
}: { signer?: Signer; provider: JsonRpcProvider | BrowserProvider }) => {
  const evmToolbox = EVMToolbox({ provider, signer });
  const chain = Chain.Polygon;

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
