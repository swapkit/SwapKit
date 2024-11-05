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
  chainId: ChainId.PolygonHex,
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "Polygon", symbol: Chain.Polygon, decimals: BaseDecimal.MATIC },
  rpcUrls: [getRPCUrl(Chain.Polygon)],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Polygon]],
});

export const MATICToolbox = ({
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
  const maticApi = api || covalentApi({ apiKey: covalentApiKey, chainId: ChainId.Polygon });
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
      getBalance({
        provider: overwriteProvider || provider,
        api: maticApi,
        address,
        chain,
        potentialScamFilter,
      }),
  };
};
