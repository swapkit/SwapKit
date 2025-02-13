import {
  ApproveMode,
  type ApproveReturnType,
  AssetValue,
  Chain,
  type EVMChain,
  EVMChains,
  type ErrorKeys,
  FeeOption,
  type FullWallet,
  MemoType,
  ProviderName,
  SwapKitError,
  type SwapKitPluginParams,
  type SwapParams,
  getMemoForDeposit,
  getMemoForLeaveAndBond,
  getMemoForNamePreferredAssetRegister,
  getMemoForNameRegister,
  getMemoForSaverDeposit,
  getMemoForSaverWithdraw,
  getMemoForUnbond,
  getMemoForWithdraw,
  getMinAmountByChain,
  wrapWithThrow,
} from "@swapkit/helpers";
import { type QuoteResponseRoute, SwapKitApi, type THORNodeType } from "@swapkit/helpers/api";
import {
  MayaArbitrumVaultAbi,
  MayaEthereumVaultAbi,
  TCAvalancheDepositABI,
  TCBaseDepositABI,
  TCBscDepositABI,
  TCEthereumVaultAbi,
} from "@swapkit/helpers/contracts";

import { prepareTxParams, validateAddressType } from "./shared";
import type {
  AddLiquidityParams,
  AddLiquidityPartParams,
  ApproveParams,
  CoreTxParams,
  CreateLiquidityParams,
  NodeActionParams,
  RegisterThornameParams,
  SavingsParams,
  SupportedChain,
  WithdrawParams,
} from "./types";

const gasFeeMultiplier: Record<FeeOption, number> = {
  [FeeOption.Average]: 1.2,
  [FeeOption.Fast]: 1.5,
  [FeeOption.Fastest]: 2,
};

const TCSpecificAbi = {
  [Chain.Avalanche]: TCAvalancheDepositABI,
  [Chain.Base]: TCBaseDepositABI,
  [Chain.BinanceSmartChain]: TCBscDepositABI,
  [Chain.Ethereum]: TCEthereumVaultAbi,
};

const MayaSpecificAbi = {
  [Chain.Arbitrum]: MayaArbitrumVaultAbi,
  [Chain.Ethereum]: MayaEthereumVaultAbi,
};

function getInboundDataFunction(type?: THORNodeType) {
  return async function getInboundDataByChain<T extends Chain>(chain: T) {
    if (
      (type === "thorchain" && chain === Chain.THORChain) ||
      (type === "mayachain" && chain === Chain.Maya)
    ) {
      return { gas_rate: "0", router: "", address: "", halted: false, chain };
    }

    const inboundData = await SwapKitApi.getInboundAddresses(type);
    const chainAddressData = inboundData.find((item) => item.chain === chain);

    if (!chainAddressData) throw new SwapKitError("core_inbound_data_not_found");
    if (chainAddressData?.halted) throw new SwapKitError("core_chain_halted");

    return chainAddressData;
  };
}

type PluginChain = Chain.Maya | Chain.THORChain;

function createTCBasedPlugin<T extends PluginChain>({
  getWallet,
  pluginChain,
}: { getWallet: <T extends SupportedChain>(chain: T) => FullWallet[T]; pluginChain: T }) {
  const pluginType = pluginChain === Chain.Maya ? "mayachain" : "thorchain";
  const getInboundDataByChain = getInboundDataFunction(pluginType);

  async function approve<T extends ApproveMode>({
    assetValue,
    type = "checkOnly" as T,
  }: { type: T; assetValue: AssetValue }) {
    const router = (await getInboundDataByChain(assetValue.chain)).router as string;

    const chain = assetValue.chain as EVMChain;

    const isEVMChain = EVMChains.includes(chain as EVMChain);
    const isNativeEVM = isEVMChain && assetValue.isGasAsset;

    if (isNativeEVM || !isEVMChain || assetValue.isSynthetic) {
      return Promise.resolve(type === "checkOnly" ? true : "approved") as ApproveReturnType<T>;
    }

    const wallet = getWallet(chain);

    if (!wallet) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    const walletAction = type === "checkOnly" ? wallet.isApproved : wallet.approve;

    if (!(assetValue.address && wallet.address)) {
      throw new SwapKitError("core_approve_asset_address_or_from_not_found");
    }

    return walletAction({
      amount: assetValue.getBaseValue("bigint"),
      assetAddress: assetValue.address,
      from: wallet.address,
      spenderAddress: router,
    });
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO refactor
  async function deposit({
    assetValue,
    recipient,
    router,
    ...rest
  }: CoreTxParams & { router?: string }) {
    const abis = pluginType === "thorchain" ? TCSpecificAbi : MayaSpecificAbi;
    const { chain, symbol, ticker } = assetValue;

    const wallet = getWallet(chain as SupportedChain);
    if (!wallet) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }
    const { address } = wallet;
    const isAddressValidated = validateAddressType({ address, chain });
    if (!isAddressValidated) {
      throw new SwapKitError("core_transaction_invalid_sender_address");
    }

    const params = prepareTxParams({ from: address, assetValue, recipient, router, ...rest });

    try {
      const abi = abis?.[chain as keyof typeof abis];

      if (!abi) {
        const wallet = getWallet(chain as PluginChain);
        const shouldDeposit = pluginChain === chain && recipient === "";
        return shouldDeposit ? wallet.deposit(params) : wallet.transfer(params);
      }

      const { getChecksumAddressFromAsset } = await import("@swapkit/toolboxes/evm");
      const wallet = getWallet(chain as EVMChain);

      return wallet.call<string>({
        abi,
        contractAddress: router || ((await getInboundDataByChain(chain)).router as string),
        funcName: "depositWithExpiry",
        funcParams: [
          recipient,
          getChecksumAddressFromAsset({ chain, symbol, ticker }, chain as EVMChain),
          assetValue.getBaseValue("string"),
          params.memo,
          rest.expiration || Number.parseInt(`${(new Date().getTime() + 15 * 60 * 1000) / 1000}`),
        ],
        txOverrides: {
          from: params.from,
          value: assetValue.isGasAsset ? assetValue.getBaseValue("bigint") : undefined,
        },
      });
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

  async function depositToProtocol({ memo, assetValue }: { assetValue: AssetValue; memo: string }) {
    const mimir = await SwapKitApi.getMimirInfo(pluginType);

    // check if trading is halted or not
    if (mimir.HALTCHAINGLOBAL >= 1 || mimir.HALTTHORCHAIN >= 1) {
      throw new SwapKitError("thorchain_chain_halted");
    }

    return deposit({ assetValue, recipient: "", memo });
  }

  async function depositToPool({
    assetValue,
    memo,
    feeOptionKey = FeeOption.Fast,
  }: { assetValue: AssetValue; memo: string; feeOptionKey?: FeeOption }) {
    const {
      gas_rate = "0",
      router,
      address: poolAddress,
    } = await getInboundDataByChain(assetValue.chain);

    return deposit({
      assetValue,
      recipient: poolAddress,
      memo,
      router,
      feeRate: Number.parseInt(gas_rate) * gasFeeMultiplier[feeOptionKey],
    });
  }

  function approveAssetValue(params: ApproveParams) {
    return approve({ ...params, type: ApproveMode.Approve });
  }

  function isAssetValueApproved(params: ApproveParams) {
    return approve({ ...params, type: ApproveMode.CheckOnly });
  }

  function registerName({ assetValue, ...params }: RegisterThornameParams) {
    return depositToProtocol({ assetValue, memo: getMemoForNameRegister(params) });
  }

  function registerPreferredAsset({
    assetValue,
    payoutAddress,
    name,
    ownerAddress,
  }: {
    assetValue: AssetValue;
    payoutAddress?: string;
    name: string;
    ownerAddress: string;
  }) {
    const payout = payoutAddress || getWallet(assetValue.chain as SupportedChain)?.address;

    if (!payout) {
      throw new SwapKitError("thorchain_preferred_asset_payout_required");
    }

    return depositToProtocol({
      assetValue: AssetValue.from({ chain: pluginChain }),
      memo: getMemoForNamePreferredAssetRegister({
        asset: assetValue.toString(),
        chain: assetValue.chain,
        name,
        owner: ownerAddress,
        payout,
      }),
    });
  }

  function nodeAction({ type, assetValue, address }: NodeActionParams) {
    const memo =
      type === MemoType.UNBOND
        ? getMemoForUnbond({ address, unbondAmount: assetValue.getBaseValue("number") })
        : getMemoForLeaveAndBond({ type, address });

    const assetToTransfer = type === MemoType.BOND ? assetValue : getMinAmountByChain(pluginChain);
    return depositToProtocol({ memo, assetValue: assetToTransfer });
  }

  async function createLiquidity({ baseAssetValue, assetValue }: CreateLiquidityParams) {
    if (baseAssetValue.lte(0) || assetValue.lte(0)) {
      throw new SwapKitError("core_transaction_create_liquidity_invalid_params");
    }

    const assetAddress = getWallet(assetValue.chain as SupportedChain).address;
    const baseAssetAddress = getWallet(pluginChain).address;

    const baseAssetTx = await wrapWithThrow(() => {
      return depositToPool({
        assetValue: baseAssetValue,
        memo: getMemoForDeposit({ ...assetValue, address: assetAddress }),
      });
    }, "core_transaction_create_liquidity_base_error");

    const assetTx = await wrapWithThrow(() => {
      return depositToPool({
        assetValue,
        memo: getMemoForDeposit({ ...assetValue, address: baseAssetAddress }),
      });
    }, "core_transaction_create_liquidity_asset_error");

    return { baseAssetTx, assetTx };
  }

  function addLiquidityPart({
    assetValue,
    poolAddress,
    address,
    symmetric,
  }: AddLiquidityPartParams) {
    if (symmetric && !address) {
      throw new SwapKitError("core_transaction_add_liquidity_invalid_params");
    }
    const memo = getMemoForDeposit({
      chain: poolAddress.split(".")[0] as Chain,
      symbol: poolAddress.split(".")[1] as string,
      address: symmetric ? address : "",
    });

    return depositToPool({ assetValue, memo });
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor
  async function addLiquidity({
    baseAssetValue,
    assetValue,
    baseAssetAddr,
    assetAddr,
    isPendingSymmAsset,
    mode = "sym",
  }: AddLiquidityParams) {
    const { chain, symbol } = assetValue;
    const isSym = mode === "sym";
    const baseTransfer = baseAssetValue?.gt(0) && (isSym || mode === "baseAsset");
    const assetTransfer = assetValue?.gt(0) && (isSym || mode === "asset");
    const includeBaseAddress = isPendingSymmAsset || baseTransfer;
    const baseAssetWalletAddress = getWallet(pluginChain).address;

    const baseAddress = includeBaseAddress ? baseAssetAddr || baseAssetWalletAddress : "";
    const assetAddress =
      isSym || mode === "asset" ? assetAddr || getWallet(chain as SupportedChain).address : "";

    if (!(baseTransfer || assetTransfer)) {
      throw new SwapKitError("core_transaction_add_liquidity_invalid_params");
    }
    if (includeBaseAddress && !baseAddress) {
      throw new SwapKitError("core_transaction_add_liquidity_base_address");
    }

    const baseAssetTx =
      baseTransfer && baseAssetValue
        ? await wrapWithThrow(() => {
            return depositToPool({
              assetValue: baseAssetValue,
              memo: getMemoForDeposit({ chain, symbol, address: assetAddress }),
            });
          }, "core_transaction_add_liquidity_base_error")
        : undefined;

    const assetTx =
      assetTransfer && assetValue
        ? await wrapWithThrow(() => {
            return depositToPool({
              assetValue,
              memo: getMemoForDeposit({ chain, symbol, address: baseAddress }),
            });
          }, "core_transaction_add_liquidity_asset_error")
        : undefined;

    return { baseAssetTx, assetTx };
  }

  function savings({ assetValue, memo, percent, type }: SavingsParams) {
    const { chain, symbol } = assetValue;
    const isDeposit = type === "add";
    const memoString = isDeposit
      ? getMemoForSaverDeposit({ symbol, chain })
      : getMemoForSaverWithdraw({
          basisPoints: Math.min(10000, Math.round(percent * 100)),
          symbol,
          chain,
        });

    return depositToPool({
      memo: memo || memoString,
      assetValue: isDeposit ? assetValue : getMinAmountByChain(chain),
    });
  }

  function withdraw({ memo, assetValue, percent, from, to }: WithdrawParams) {
    const targetAsset =
      to === "baseAsset" && from !== "baseAsset"
        ? AssetValue.from({ chain: pluginChain })
        : (from === "sym" && to === "sym") || from === "baseAsset" || from === "asset"
          ? undefined
          : assetValue;

    const value = getMinAmountByChain(from === "asset" ? assetValue.chain : pluginChain);
    const memoString =
      memo ||
      getMemoForWithdraw({
        symbol: assetValue.symbol,
        chain: assetValue.chain,
        ticker: assetValue.ticker,
        basisPoints: Math.min(10000, Math.round(percent * 100)),
        targetAsset: targetAsset?.toString(),
      });

    return depositToPool({ assetValue: value, memo: memoString });
  }

  async function swap({ feeOptionKey, route }: SwapParams<typeof pluginType, QuoteResponseRoute>) {
    const { memo, expiration, targetAddress } = route;

    const assetValue = await AssetValue.from({
      asyncTokenLookup: true,
      asset: route.sellAsset,
      value: route.sellAmount,
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

  return {
    addLiquidity,
    addLiquidityPart,
    approveAssetValue,
    createLiquidity,
    deposit,
    depositToPool,
    getInboundDataByChain,
    isAssetValueApproved,
    nodeAction,
    registerName,
    registerPreferredAsset,
    savings,
    swap,
    withdraw,
  };
}

function plugin<T extends Record<string, unknown>>({
  chain,
  ...rest
}: { chain: Chain.THORChain | Chain.Maya } & T) {
  return function plugin({ getWallet }: SwapKitPluginParams) {
    const sharedPlugin = createTCBasedPlugin({ getWallet, pluginChain: chain });

    return { ...sharedPlugin, ...rest };
  };
}

export const ThorchainPlugin = {
  thorchain: {
    plugin: plugin({
      chain: Chain.THORChain,
      supportedSwapkitProviders: [ProviderName.THORCHAIN, ProviderName.THORCHAIN_STREAMING],
    }),
  },
} as const;

export const MayachainPlugin = { mayachain: { plugin: plugin({ chain: Chain.Maya }) } } as const;
