import type { QuoteResponseRoute } from "@swapkit/api";
import {
  AssetValue,
  Chain,
  type EVMChain,
  type ErrorKeys,
  MemoType,
  ProviderName,
  SwapKitError,
  type SwapKitPluginParams,
  type SwapParams,
  TCAvalancheDepositABI,
  TCBaseDepositABI,
  TCBscDepositABI,
  TCEthereumVaultAbi,
  type UTXOChain,
  getMemoForLoan,
} from "@swapkit/helpers";

import { basePlugin } from "./basePlugin";
import { prepareTxParams, validateAddressType } from "./shared";
import type { AddLiquidityParams, CoreTxParams, CreateLiquidityParams, LoanParams } from "./types";

type SupportedChain = EVMChain | Chain.THORChain | UTXOChain | Chain.Cosmos;

function plugin({ getWallet, stagenet = false }: SwapKitPluginParams) {
  const {
    getInboundDataByChain,
    register,
    depositToPool,
    addLiquidity: pluginAddLiquidity,
    createLiquidity: pluginCreateLiquidity,
    ...pluginMethods
  } = basePlugin({
    getWallet,
    pluginChain: Chain.THORChain,
    stagenet,
    deposit,
  });

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO refactor
  async function deposit({
    assetValue,
    recipient,
    router,
    ...rest
  }: CoreTxParams & { router?: string }) {
    const { chain, symbol, ticker } = assetValue;

    const wallet = getWallet(chain as SupportedChain);
    if (!wallet) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    const isAddressValidated = validateAddressType({ address: wallet.address, chain });

    if (!isAddressValidated) {
      throw new SwapKitError("core_transaction_invalid_sender_address");
    }

    const params = prepareTxParams({
      from: wallet.address,
      assetValue,
      recipient,
      router,
      ...rest,
    });

    try {
      switch (chain) {
        case Chain.THORChain: {
          const wallet = getWallet(chain);
          return recipient === "" ? wallet.deposit(params) : wallet.transfer(params);
        }

        case Chain.Ethereum:
        case Chain.BinanceSmartChain:
        case Chain.Base:
        case Chain.Avalanche: {
          const wallet = getWallet(chain);
          const { getChecksumAddressFromAsset } = await import("@swapkit/toolbox-evm");

          const ChainSpecificAbi = {
            [Chain.Avalanche]: TCAvalancheDepositABI,
            [Chain.Base]: TCBaseDepositABI,
            [Chain.BinanceSmartChain]: TCBscDepositABI,
            [Chain.Ethereum]: TCEthereumVaultAbi,
          };

          const abi = ChainSpecificAbi[chain];

          return wallet.call<string>({
            abi,
            contractAddress:
              router || ((await getInboundDataByChain(chain as EVMChain)).router as string),
            funcName: "depositWithExpiry",
            funcParams: [
              recipient,
              getChecksumAddressFromAsset({ chain, symbol, ticker }, chain),
              assetValue.getBaseValue("string"),
              params.memo,
              rest.expiration ||
                Number.parseInt(`${(new Date().getTime() + 15 * 60 * 1000) / 1000}`),
            ],
            txOverrides: {
              from: params.from,
              value: assetValue.isGasAsset ? assetValue.getBaseValue("bigint") : undefined,
            },
          });
        }

        default: {
          if (wallet) {
            return wallet.transfer(params);
          }

          throw new SwapKitError("core_wallet_connection_not_found");
        }
      }
    } catch (error) {
      const errorMessage =
        // @ts-expect-error Fine to use error as string
        typeof error === "string" ? error.toLowerCase() : error?.message.toLowerCase();
      const isInsufficientFunds = errorMessage?.includes("insufficient funds");
      const isGas = errorMessage?.includes("gas");
      const isServer = errorMessage?.includes("server");
      const isUserRejected = errorMessage?.includes("user rejected");
      const errorKey: ErrorKeys = isInsufficientFunds
        ? "core_transaction_deposit_insufficient_funds_error"
        : isGas
          ? "core_transaction_deposit_gas_error"
          : isServer
            ? "core_transaction_deposit_server_error"
            : isUserRejected
              ? "core_transaction_user_rejected"
              : "core_transaction_deposit_error";

      throw new SwapKitError(errorKey, error);
    }
  }

  function loan({ assetValue, memo, minAmount, type }: LoanParams) {
    return depositToPool({
      assetValue,
      memo:
        memo ||
        getMemoForLoan(type === "open" ? MemoType.OPEN_LOAN : MemoType.CLOSE_LOAN, {
          asset: assetValue.toString(),
          minAmount: minAmount.toString(),
          address: getWallet(assetValue.chain as SupportedChain).address,
        }),
    });
  }

  async function swap({ route, feeOptionKey }: SwapParams<"thorchain", QuoteResponseRoute>) {
    if (!route) throw new SwapKitError("core_swap_invalid_params");

    const { memo, expiration, targetAddress } = route;

    const assetValue = await AssetValue.from({
      asset: route.sellAsset,
      value: route.sellAmount,
      asyncTokenLookup: true,
    });

    if (!assetValue) {
      throw new SwapKitError("core_swap_asset_not_recognized");
    }

    const isRecipientValidated = validateAddressType({
      address: route.destinationAddress,
      chain: AssetValue.from({ asset: route.buyAsset }).chain,
    });

    if (!isRecipientValidated) {
      throw new SwapKitError("core_transaction_invalid_recipient_address");
    }

    const { address: recipient } = await getInboundDataByChain(assetValue.chain);

    return deposit({
      expiration: Number(expiration),
      assetValue,
      memo,
      feeOptionKey,
      router: targetAddress,
      recipient,
    });
  }

  async function addLiquidity(params: AddLiquidityParams) {
    const { baseAssetTx, assetTx } = await pluginAddLiquidity(params);

    return {
      /**
       * @deprecated use baseAssetTx instead
       */
      runeTx: baseAssetTx,
      baseAssetTx,
      assetTx,
    };
  }

  async function createLiquidity(params: CreateLiquidityParams) {
    const { baseAssetTx, assetTx } = await pluginCreateLiquidity(params);

    return {
      /**
       * @deprecated use baseAssetTx instead
       */
      runeTx: baseAssetTx,
      baseAssetTx,
      assetTx,
    };
  }

  return {
    ...pluginMethods,
    addLiquidity,
    createLiquidity,
    deposit,
    getInboundDataByChain,
    loan,
    registerTHORName: register,
    swap,
    supportedSwapkitProviders: [ProviderName.THORCHAIN, ProviderName.THORCHAIN_STREAMING],
    /**
     * @deprecated Use registerTHORName instead
     */
    registerThorname: register,
  };
}

export const ThorchainPlugin = { thorchain: { plugin } } as const;

/**
 * @deprecated Use import { ThorchainPlugin } from "@swapkit/plugin-thorchain" instead
 */
export const ThorchainProvider = ThorchainPlugin;
