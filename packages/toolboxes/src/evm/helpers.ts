import {
  AssetValue,
  BaseDecimal,
  type EVMChain,
  FeeOption,
  SwapKitNumber,
  filterAssets,
  formatBigIntToSafeValue,
  isGasAsset,
} from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Provider } from "ethers";

import { getEvmApi } from "./api";
import { getEstimateGasPrices } from "./toolbox/baseEVMToolbox";
import type { EIP1559TxParams, EVMMaxSendableAmountsParams } from "./types";

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
  const balance = (await toolbox.getBalance(from)).find(({ symbol, chain }) =>
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

export const getBalance = async ({
  provider,
  address,
  chain,
  potentialScamFilter,
}: {
  provider: JsonRpcProvider | BrowserProvider;
  address: string;
  chain: EVMChain;
  potentialScamFilter?: boolean;
}) => {
  const tokenBalances = await getEvmApi(chain).getBalance(address);
  const evmGasTokenBalance = await provider.getBalance(address);

  const balances = [
    {
      chain,
      symbol: AssetValue.from({ chain }).symbol,
      value: formatBigIntToSafeValue({
        value: BigInt(evmGasTokenBalance),
        decimal: 18,
        bigIntDecimal: 18,
      }),
      decimal: BaseDecimal[chain],
    },
    ...tokenBalances.filter((token) => !isGasAsset(token)),
  ];

  const filteredBalances = potentialScamFilter ? filterAssets(balances) : balances;

  return filteredBalances.map(
    ({ symbol, value, decimal }) =>
      new AssetValue({
        decimal: decimal || BaseDecimal[chain],
        value,
        identifier: `${chain}.${symbol}`,
      }),
  );
};

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
