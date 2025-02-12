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
  chainId: ChainId.BinanceSmartChainHex,
  chainName: "BNB Chain",
  nativeCurrency: { name: "Binance Coin", symbol: "BNB", decimals: BaseDecimal.BSC },
  rpcUrls: ["https://bsc-dataseed.binance.org"],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.BinanceSmartChain]],
});

export const BSCToolbox = ({
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
        chain: Chain.BinanceSmartChain,
      },
    });
  }

  const bscApi =
    api || covalentApi({ apiKey: apiKey as string, chainId: ChainId.BinanceSmartChain });
  const evmToolbox = EVMToolbox({ provider, signer, isEIP1559Compatible: false });
  const chain = Chain.BinanceSmartChain;

  return {
    ...evmToolbox,
    getNetworkParams,
    estimateTransactionFee: (txObject: EVMTxBaseParams, feeOptionKey: FeeOption) =>
      estimateTransactionFee(txObject, feeOptionKey, chain, provider, false),
    getBalance: (
      address: string,
      potentialScamFilter = true,
      overwriteProvider?: JsonRpcProvider | BrowserProvider,
    ) =>
      getBalance({
        provider: overwriteProvider || provider,
        api: bscApi,
        address,
        chain,
        potentialScamFilter,
      }),
  };
};
