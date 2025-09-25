import {
  ApproveMode,
  type ApproveReturnType,
  AssetValue,
  type EVMChain,
  EVMChains,
  ProviderName,
  SwapKitError,
  type SwapParams,
} from "@swapkit/helpers";
import type { EVMTransaction, QuoteResponseRoute } from "@swapkit/helpers/api";
import type { SwapKitPluginParams } from "../types";
import { createPlugin } from "../utils";

function approve<T extends ApproveMode>({ approveMode, getWallet }: { approveMode: T } & SwapKitPluginParams) {
  return function approveEVM({ assetValue, spenderAddress }: { spenderAddress: string; assetValue: AssetValue }) {
    const evmChain = assetValue.chain as EVMChain;
    const isEVMChain = EVMChains.includes(evmChain);
    const isNativeEVM = isEVMChain && assetValue.isGasAsset;

    if (isNativeEVM || !isEVMChain || assetValue.isSynthetic) {
      const isApproved = approveMode === "checkOnly" || "approved";
      return Promise.resolve(isApproved) as ApproveReturnType<T>;
    }

    const wallet = getWallet(evmChain);
    if (!wallet) throw new SwapKitError("core_wallet_connection_not_found");
    const walletAction = approveMode === "checkOnly" ? wallet.isApproved : wallet.approve;

    if (!(assetValue.address && wallet.address)) {
      throw new SwapKitError("core_approve_asset_address_or_from_not_found");
    }

    return walletAction({
      amount: assetValue.getBaseValue("bigint"),
      assetAddress: assetValue.address,
      from: wallet.address,
      spenderAddress,
    });
  };
}

export const EVMPlugin = createPlugin({
  methods: ({ getWallet }) => ({
    approveAssetValue: approve({ approveMode: ApproveMode.Approve, getWallet }),
    isAssetValueApproved: approve({ approveMode: ApproveMode.CheckOnly, getWallet }),
    swap: async function evmSwap({ route: { tx, sellAsset }, feeOptionKey }: SwapParams<"evm", QuoteResponseRoute>) {
      const assetValue = await AssetValue.from({ asset: sellAsset, asyncTokenLookup: true });
      const evmChain = assetValue.chain as EVMChain;
      const wallet = getWallet(evmChain);
      if (!wallet) throw new SwapKitError("core_wallet_connection_not_found");

      if (!(EVMChains.includes(evmChain) && tx)) {
        throw new SwapKitError("core_swap_invalid_params");
      }

      const { from, to, data, value } = tx as EVMTransaction;
      return wallet.sendTransaction({ data, feeOptionKey, from, to, value: BigInt(value) });
    },
  }),
  name: "evm",
  properties: {
    supportedSwapkitProviders: [
      ProviderName.CAMELOT_V3,
      ProviderName.OPENOCEAN_V2,
      ProviderName.ONEINCH,
      ProviderName.PANCAKESWAP,
      ProviderName.PANGOLIN_V1,
      ProviderName.SUSHISWAP_V2,
      ProviderName.TRADERJOE_V2,
      ProviderName.UNISWAP_V2,
      ProviderName.UNISWAP_V3,
    ],
  },
});
