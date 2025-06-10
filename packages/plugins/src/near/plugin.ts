import {
  AssetValue,
  ProviderName,
  SwapKitError,
  type SwapParams,
  createPlugin,
} from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";
import type { NearDepositChannelParams, NearSwapResponse, NearSwapRoute } from "./types";

export const NearPlugin = createPlugin({
  name: "near",
  properties: {
    supportedSwapkitProviders: [ProviderName.NEAR],
  },
  methods: ({ getWallet }) => ({
    async swap({
      route,
      recipient,
    }: SwapParams<{
      route: NearSwapRoute & {
        meta?: {
          nearSwapInfo?: NearDepositChannelParams;
        };
      };
    }>) {
      const { meta } = route as any;
      if (!meta?.nearSwapInfo) {
        throw new SwapKitError("core_swap_invalid_params", {
          message: "Missing NEAR swap metadata",
        });
      }

      const nearSwapInfo = meta.nearSwapInfo;
      const srcWallet = await getWallet(nearSwapInfo.srcChain);

      const nearDepositChannelParams: NearDepositChannelParams = {
        ...nearSwapInfo,
        toAddress: recipient || (await srcWallet.getAddress()),
      };

      // TODO: Implement getNearDepositChannel in SwapKitApi
      // This endpoint needs to be added to the API for NEAR support
      const response = await (SwapKitApi as any).getNearDepositChannel?.(nearDepositChannelParams);
      if (!response) {
        throw new SwapKitError("core_plugin_not_found", {
          info: "NEAR deposit channel API not implemented",
        });
      }
      const nearResponse = response as NearSwapResponse;

      if (!nearResponse.isSuccess) {
        throw new SwapKitError("core_swap_invalid_params", {
          message: "Failed to create NEAR deposit channel",
        });
      }

      const { channelId, depositAddress } = nearResponse.response;

      const assetValue = AssetValue.from({
        chain: nearSwapInfo.srcChain,
        symbol: nearSwapInfo.srcToken,
        value: nearSwapInfo.amount,
        decimal: (route as any).srcToken.decimals,
      });

      const txHash = await srcWallet.transfer({
        assetValue,
        recipient: depositAddress,
        memo: channelId,
      });

      return txHash;
    },
  }),
});
