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
        chain: Chain.Polygon,
      },
    });
  }

  const maticApi = api || covalentApi({ apiKey: apiKey as string, chainId: ChainId.Polygon });
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
