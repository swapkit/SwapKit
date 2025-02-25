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
  filterAssets,
  formatBigIntToSafeValue,
  isGasAsset,
} from "@swapkit/helpers";
import { type BrowserProvider, JsonRpcProvider, type Provider } from "ethers";

import { getEvmApi } from "./api";
import { getEstimateGasPrices } from "./toolbox/baseEVMToolbox";
import type { EIP1559TxParams, EVMMaxSendableAmountsParams } from "./types";

export const getProvider = (chain: EVMChain, customUrl?: string) => {
  return new JsonRpcProvider(customUrl || SKConfig.get("rpcUrls")[chain]);
};

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

export function getBalance<C extends EVMChain>({
  provider: toolboxProvider,
  chain,
}: { provider?: BrowserProvider | JsonRpcProvider; chain: C }) {
  return async function getBalance(
    address: string,
    scamFilter = true,
    overwriteProvider?: BrowserProvider | JsonRpcProvider,
  ) {
    const provider = overwriteProvider || toolboxProvider;
    const tokenBalances = await getEvmApi(chain).getBalance(address);
    const evmGasTokenBalance = (await provider?.getBalance(address)) || 0n;

    const balances = [
      {
        chain,
        decimal: BaseDecimal[chain],
        symbol: AssetValue.from({ chain }).symbol,
        value: formatBigIntToSafeValue({
          value: BigInt(evmGasTokenBalance),
          decimal: BaseDecimal[chain],
          bigIntDecimal: BaseDecimal[chain],
        }),
      },
      ...tokenBalances.filter((token) => !isGasAsset(token)),
    ];

    const filteredBalances = scamFilter ? filterAssets(balances) : balances;

    return filteredBalances.map(
      ({ symbol, value, decimal }) =>
        new AssetValue({
          decimal: decimal || BaseDecimal[chain],
          value,
          identifier: `${chain}.${symbol}`,
        }),
    );
  };
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
