import { BaseDecimal, Chain, ChainId, ChainToExplorerUrl, type FeeOption } from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";

import { type EVMTxBaseParams, estimateTransactionFee, getBalance } from "../index";
import { EVMToolbox } from "./EVMToolbox";

const getNetworkParams = () => ({
  chainId: ChainId.BinanceSmartChainHex,
  chainName: "BNB Chain",
  nativeCurrency: { name: "Binance Coin", symbol: "BNB", decimals: BaseDecimal.BSC },
  rpcUrls: ["https://bsc-dataseed.binance.org"],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.BinanceSmartChain]],
});

export const BSCToolbox = ({
  provider,
  signer,
}: { signer?: Signer; provider: JsonRpcProvider | BrowserProvider }) => {
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
      getBalance({ provider: overwriteProvider || provider, address, chain, potentialScamFilter }),
  };
};
