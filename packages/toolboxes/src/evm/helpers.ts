import {
  AssetValue,
  BaseDecimal,
  Chain,
  ChainToExplorerUrl,
  ChainToHexChainId,
  type EVMChain,
  FeeOption,
  type NetworkParams,
  SKConfig,
  SwapKitNumber,
} from "@swapkit/helpers";
import type { BrowserProvider, Provider } from "ethers";

import { getEstimateGasPrices } from "./toolbox/baseEVMToolbox";
import type { EIP1559TxParams, EVMMaxSendableAmountsParams } from "./types";

export async function getProvider(chain: EVMChain, customUrl?: string) {
  const { JsonRpcProvider } = await import("ethers");

  return new JsonRpcProvider(customUrl || SKConfig.get("rpcUrls")[chain]);
}

/**
 * @deprecated
 */
export const estimateMaxSendableAmount = async ({
  toolbox,
  from,
  memo = "",
  feeOptionKey = FeeOption.Fastest,
  assetValue,
  abi,
  funcName,
  funcParams,
  contractAddress,
  txOverrides,
}: EVMMaxSendableAmountsParams): Promise<AssetValue> => {
  const balances = await toolbox.getBalance(from);
  const balance = balances.find(({ symbol, chain }) =>
    assetValue ? symbol === assetValue.symbol : symbol === AssetValue.from({ chain })?.symbol,
  );

  const gasRate = (await toolbox.estimateGasPrices())[feeOptionKey];

  if (!balance) return AssetValue.from({ chain: assetValue.chain });

  if (assetValue && (balance.chain !== assetValue.chain || balance.symbol !== assetValue?.symbol)) {
    return balance;
  }

  const gasLimit =
    abi && funcName && funcParams && contractAddress
      ? await toolbox.estimateCall({
          contractAddress,
          abi,
          funcName,
          funcParams,
          txOverrides,
        })
      : await toolbox.estimateGasLimit({
          from,
          recipient: from,
          memo,
          assetValue,
        });

  const isFeeEIP1559Compatible = "maxFeePerGas" in gasRate;
  const isFeeEVMLegacyCompatible = "gasPrice" in gasRate;

  if (!(isFeeEVMLegacyCompatible || isFeeEIP1559Compatible)) {
    throw new Error("Could not fetch fee data");
  }

  const fee =
    gasLimit *
    (isFeeEIP1559Compatible
      ? (gasRate.maxFeePerGas || 1n) + (gasRate.maxPriorityFeePerGas || 1n)
      : gasRate.gasPrice);
  const maxSendableAmount = SwapKitNumber.fromBigInt(balance.getBaseValue("bigint")).sub(
    fee.toString(),
  );

  return AssetValue.from({ chain: balance.chain, value: maxSendableAmount.getValue("string") });
};

export function toHexString(value: bigint) {
  return value > 0n ? `0x${value.toString(16)}` : "0x0";
}

export function getEstimateTransactionFee({
  provider,
  isEIP1559Compatible = true,
}: { provider: Provider | BrowserProvider; isEIP1559Compatible?: boolean }) {
  return async function estimateTransactionFee({
    feeOption = FeeOption.Fast,
    chain,
    ...txObject
  }: EIP1559TxParams & { feeOption: FeeOption; chain: EVMChain }) {
    const estimateGasPrices = getEstimateGasPrices({ provider, isEIP1559Compatible });
    const gasPrices = await estimateGasPrices();
    const gasLimit = await provider.estimateGas(txObject);

    const assetValue = AssetValue.from({ chain });
    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = gasPrices[feeOption];

    if (!isEIP1559Compatible && gasPrice) {
      return assetValue.set(SwapKitNumber.fromBigInt(gasPrice * gasLimit, assetValue.decimal));
    }

    if (maxFeePerGas && maxPriorityFeePerGas) {
      const fee = (maxFeePerGas + maxPriorityFeePerGas) * gasLimit;

      return assetValue.set(SwapKitNumber.fromBigInt(fee, assetValue.decimal));
    }

    throw new Error("No gas price found");
  };
}

export function getNetworkParams<C extends EVMChain>(chain: C) {
  return () =>
    (Chain.Ethereum === chain
      ? undefined
      : {
          ...getNetworkInfo({ chain }),
          chainId: ChainToHexChainId[chain],
          rpcUrls: [SKConfig.get("rpcUrls")[chain]],
          blockExplorerUrls: [ChainToExplorerUrl[chain]],
        }) as C extends Chain.Ethereum ? undefined : NetworkParams;
}

export function getIsEIP1559Compatible<C extends EVMChain>(chain: C) {
  const notCompatible = [Chain.Arbitrum, Chain.BinanceSmartChain];

  return !notCompatible.includes(chain);
}

function getNetworkInfo<C extends EVMChain>({ chain }: { chain: C }) {
  const decimals = BaseDecimal[chain];

  switch (chain) {
    case Chain.Arbitrum:
      return {
        chainName: "Arbitrum One",
        nativeCurrency: { name: "Ethereum", symbol: Chain.Ethereum, decimals },
      };
    case Chain.Avalanche:
      return {
        chainName: "Avalanche Network",
        nativeCurrency: { name: "Avalanche", symbol: chain, decimals },
      };
    case Chain.Base:
      return {
        chainName: "Base Mainnet",
        nativeCurrency: { name: "Ethereum", symbol: Chain.Ethereum, decimals },
      };
    case Chain.BinanceSmartChain:
      return {
        chainName: "BNB Chain",
        nativeCurrency: { name: "Binance Coin", symbol: "BNB", decimals },
      };
    case Chain.Polygon:
      return {
        chainName: "Polygon Mainnet",
        nativeCurrency: { name: "Polygon", symbol: Chain.Polygon, decimals },
      };
    default:
      throw new Error(`Chain ${chain} is not supported`);
  }
}
