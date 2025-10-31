import {
  ApproveMode,
  AssetValue,
  type EVMChain,
  EVMChains,
  ProviderName,
  SwapKitError,
  type SwapParams,
} from "@swapkit/helpers";
import type { EVMTransaction, QuoteResponseRoute } from "@swapkit/helpers/api";
import { approve, createPlugin } from "../utils";

export const EVMPlugin = createPlugin({
  methods: ({ getWallet }) => ({
    approveAssetValue: approve({ approveMode: ApproveMode.Approve, getWallet }),
    isAssetValueApproved: approve({ approveMode: ApproveMode.CheckOnly, getWallet }),
    swap: async function evmSwap({ route: { tx, sellAsset }, feeOptionKey }: SwapParams<"evm", QuoteResponseRoute>) {
      const assetValue = await AssetValue.from({ asset: sellAsset, asyncTokenLookup: true });
      const evmChain = assetValue.chain as EVMChain;
      const wallet = getWallet(evmChain);

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
      ProviderName.OKX,
      ProviderName.ONEINCH,
      ProviderName.PANCAKESWAP,
      ProviderName.PANGOLIN_V1,
      ProviderName.SUSHISWAP_V2,
      ProviderName.TRADERJOE_V2,
      ProviderName.UNISWAP_V2,
      ProviderName.UNISWAP_V3,
    ] as const,
  },
});
