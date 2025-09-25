import {
  ApproveMode,
  type ApproveReturnType,
  AssetValue,
  Chain,
  type ErrorKeys,
  type EVMChain,
  EVMChains,
  FeeOption,
  getChainConfig,
  getMemoForDeposit,
  getMemoForLeaveAndBond,
  getMemoForNamePreferredAssetRegister,
  getMemoForNameRegister,
  getMemoForTcyClaim,
  getMemoForTcyStake,
  getMemoForUnbond,
  getMemoForWithdraw,
  getMinAmountByChain,
  MemoType,
  ProviderName,
  SwapKitError,
  type SwapParams,
  type TCLikeChain,
  wrapWithThrow,
} from "@swapkit/helpers";
import {
  type InboundAddressesItem,
  type QuoteResponseRoute,
  SwapKitApi,
  type THORNodeType,
} from "@swapkit/helpers/api";
import {
  MayaArbitrumVaultAbi,
  MayaEthereumVaultAbi,
  TCAvalancheDepositABI,
  TCBaseDepositABI,
  TCBscDepositABI,
  TCEthereumVaultAbi,
} from "@swapkit/helpers/contracts";
import type { SwapKitPluginParams } from "../types";
import { createPlugin } from "../utils";
import { prepareTxParams, validateAddressType } from "./shared";
import type {
  AddLiquidityParams,
  AddLiquidityPartParams,
  CoreTxParams,
  CreateLiquidityParams,
  NodeActionParams,
  RegisterThornameParams,
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

const MayaSpecificAbi = { [Chain.Arbitrum]: MayaArbitrumVaultAbi, [Chain.Ethereum]: MayaEthereumVaultAbi };

export const ThorchainPlugin = createPlugin({
  methods: createTCBasedPlugin(Chain.THORChain),
  name: "thorchain",
  properties: { supportedSwapkitProviders: [ProviderName.THORCHAIN, ProviderName.THORCHAIN_STREAMING] },
});

export const MayachainPlugin = createPlugin({
  methods: createTCBasedPlugin(Chain.Maya),
  name: "mayachain",
  properties: { supportedSwapkitProviders: [ProviderName.MAYACHAIN, ProviderName.MAYACHAIN_STREAMING] },
});

function getInboundDataFunction(type?: THORNodeType) {
  return async function getInboundDataByChain<T extends Chain>(chain: T) {
    if ((type === "thorchain" && chain === Chain.THORChain) || (type === "mayachain" && chain === Chain.Maya)) {
      return {
        address: "",
        chain,
        dust_threshold: "0",
        gas_rate: "0",
        halted: false,
        router: "",
      } as InboundAddressesItem;
    }

    const inboundData = await SwapKitApi.thornode.getInboundAddresses(type);
    const chainAddressData = inboundData.find((item) => item.chain === chain);

    if (!chainAddressData) throw new SwapKitError("core_inbound_data_not_found");
    if (chainAddressData?.halted) throw new SwapKitError("core_chain_halted");

    return chainAddressData;
  };
}

function createTCBasedPlugin<T extends TCLikeChain>(pluginChain: T) {
  return function plugin({ getWallet }: SwapKitPluginParams) {
    const pluginType = pluginChain === Chain.Maya ? "mayachain" : "thorchain";
    const getInboundDataByChain = getInboundDataFunction(pluginType);

    async function approve<T extends ApproveMode>({
      assetValue,
      type = "checkOnly" as T,
    }: {
      type: T;
      assetValue: AssetValue;
    }) {
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

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO
    async function deposit({ assetValue, recipient, router, ...rest }: CoreTxParams & { router?: string }) {
      const abis = pluginType === "thorchain" ? TCSpecificAbi : MayaSpecificAbi;
      const { chain, symbol, ticker } = assetValue;

      const wallet = getWallet(chain);
      if (!wallet) {
        throw new SwapKitError("core_wallet_connection_not_found");
      }
      const { address } = wallet;
      const isAddressValidated = validateAddressType({ address, chain });
      if (!isAddressValidated) {
        throw new SwapKitError("core_transaction_invalid_sender_address");
      }

      const params = prepareTxParams({ assetValue, from: address, recipient, router, ...rest });

      try {
        const abi = abis?.[chain as keyof typeof abis];

        if (!abi) {
          const wallet = getWallet(chain as TCLikeChain);
          const shouldDeposit = pluginChain === chain && recipient === "";
          // @Towan: Is that the same action? :)
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
            rest.expiration || Number.parseInt(`${(Date.now() + 15 * 60 * 1000) / 1000}`, 10),
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
      const mimir = await SwapKitApi.thornode.getMimirInfo(pluginType);

      // check if trading is halted or not
      if (mimir.HALTCHAINGLOBAL >= 1 || mimir.HALTTHORCHAIN >= 1) {
        throw new SwapKitError("thorchain_chain_halted");
      }

      return deposit({ assetValue, memo, recipient: "" });
    }

    async function depositToPool({
      assetValue,
      memo,
      feeOptionKey = FeeOption.Fast,
    }: {
      assetValue: AssetValue;
      memo: string;
      feeOptionKey?: FeeOption;
    }) {
      const { gas_rate = "0", router, address: poolAddress } = await getInboundDataByChain(assetValue.chain);

      return deposit({
        assetValue,
        feeRate: Number.parseInt(gas_rate, 10) * gasFeeMultiplier[feeOptionKey],
        memo,
        recipient: poolAddress,
        router,
      });
    }

    function approveAssetValue({ assetValue }: { assetValue: AssetValue }) {
      return approve({ assetValue, type: ApproveMode.Approve });
    }

    function isAssetValueApproved({ assetValue }: { assetValue: AssetValue }) {
      return approve({ assetValue, type: ApproveMode.CheckOnly });
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
      const payout = payoutAddress || getWallet(assetValue.chain)?.address;

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
          : getMemoForLeaveAndBond({ address, type });

      const assetToTransfer = type === MemoType.BOND ? assetValue : getMinAmountByChain(pluginChain);
      return depositToProtocol({ assetValue: assetToTransfer, memo });
    }

    async function createLiquidity({ baseAssetValue, assetValue }: CreateLiquidityParams) {
      if (baseAssetValue.lte(0) || assetValue.lte(0)) {
        throw new SwapKitError("core_transaction_create_liquidity_invalid_params");
      }

      const assetAddress = getWallet(assetValue.chain).address;
      const baseAssetAddress = getWallet(pluginChain).address;

      const baseAssetTx = await wrapWithThrow(() => {
        return depositToPool({
          assetValue: baseAssetValue,
          memo: getMemoForDeposit({ ...assetValue, address: assetAddress }),
        });
      }, "core_transaction_create_liquidity_base_error");

      const assetTx = await wrapWithThrow(() => {
        return depositToPool({ assetValue, memo: getMemoForDeposit({ ...assetValue, address: baseAssetAddress }) });
      }, "core_transaction_create_liquidity_asset_error");

      return { assetTx, baseAssetTx };
    }

    function addLiquidityPart({ assetValue, poolAddress, address, symmetric }: AddLiquidityPartParams) {
      if (symmetric && !address) {
        throw new SwapKitError("core_transaction_add_liquidity_invalid_params");
      }
      const memo = getMemoForDeposit({
        address: symmetric ? address : "",
        chain: poolAddress.split(".")[0] as Chain,
        symbol: poolAddress.split(".")[1] as string,
      });

      return depositToPool({ assetValue, memo });
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO
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
      const assetAddress = isSym || mode === "asset" ? assetAddr || getWallet(chain).address : "";

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
                memo: getMemoForDeposit({ address: assetAddress, chain, symbol }),
              });
            }, "core_transaction_add_liquidity_base_error")
          : undefined;

      const assetTx =
        assetTransfer && assetValue
          ? await wrapWithThrow(() => {
              return depositToPool({ assetValue, memo: getMemoForDeposit({ address: baseAddress, chain, symbol }) });
            }, "core_transaction_add_liquidity_asset_error")
          : undefined;

      return { assetTx, baseAssetTx };
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
          basisPoints: Math.min(10000, Math.round(percent * 100)),
          chain: assetValue.chain,
          symbol: assetValue.symbol,
          targetAsset: targetAsset?.toString(),
          ticker: assetValue.ticker,
        });

      return depositToPool({ assetValue: value, memo: memoString });
    }

    async function claimTcy({ chain, thorAddress }: { chain: Chain; thorAddress: string }) {
      const inboundData = await getInboundDataByChain(chain);
      const dust_threshold = inboundData.dust_threshold;
      const { baseDecimal: chainDecimal } = getChainConfig(chain);
      const { baseDecimal: tcDecimal } = getChainConfig(Chain.THORChain);

      return deposit({
        assetValue: AssetValue.from({
          chain,
          fromBaseDecimal: Math.min(chainDecimal, tcDecimal),
          value: chain !== Chain.THORChain ? dust_threshold : 0,
        }),
        memo: getMemoForTcyClaim(MemoType.CLAIM_TCY, { address: thorAddress }),
        recipient: inboundData.address,
        router: inboundData.router,
      });
    }

    function stakeTcyAction(
      params: { type: "unstake"; unstakeBps: number } | { type: "stake"; assetValue: AssetValue },
    ) {
      if (params.type === "stake") {
        if (params.assetValue.toString() !== "THOR.TCY") {
          throw new SwapKitError("thorchain_asset_is_not_tcy");
        }

        return deposit({
          assetValue: params.assetValue,
          memo: getMemoForTcyStake(MemoType.STAKE_TCY, {}),
          recipient: "",
        });
      }

      return deposit({
        assetValue: AssetValue.from({ chain: Chain.THORChain }),
        memo: getMemoForTcyStake(MemoType.UNSTAKE_TCY, { unstakeBps: params.unstakeBps }),
        recipient: "",
      });
    }

    async function swap({ feeOptionKey, route }: SwapParams<typeof pluginType, QuoteResponseRoute>) {
      const { memo, expiration, targetAddress } = route;

      const assetValue = await AssetValue.from({
        asset: route.sellAsset,
        asyncTokenLookup: true,
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
        assetValue,
        expiration: Number(expiration),
        feeOptionKey,
        memo,
        recipient,
        router: targetAddress,
      });
    }

    return {
      addLiquidity,
      addLiquidityPart,
      approveAssetValue,
      claimTcy,
      createLiquidity,
      deposit,
      depositToPool,
      getInboundDataByChain,
      isAssetValueApproved,
      nodeAction,
      registerName,
      registerPreferredAsset,
      stakeTcyAction,
      swap,
      withdraw,
    };
  };
}
