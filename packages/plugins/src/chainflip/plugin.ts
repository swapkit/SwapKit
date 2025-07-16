import {
  AssetValue,
  type CryptoChain,
  ProviderName,
  SKConfig,
  SwapKitError,
} from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";
import { createPlugin } from "../utils";
import type { RequestSwapDepositAddressParams } from "./types";

export const ChainflipPlugin = createPlugin({
  name: "chainflip",
  methods: ({ getWallet }) => ({
    swap: async function chainflipSwap(swapParams: RequestSwapDepositAddressParams) {
      const brokerUrl = SKConfig.get("integrations").chainflip?.brokerUrl;

      if (!(swapParams?.route?.buyAsset && brokerUrl && swapParams.route.meta.chainflip)) {
        throw new SwapKitError("core_swap_invalid_params", {
          ...swapParams,
          chainflipBrokerUrl: brokerUrl,
        });
      }

      const {
        route: {
          buyAsset: buyAssetString,
          sellAsset: sellAssetString,
          sellAmount,
          destinationAddress: recipient,
          meta: { chainflip },
        },
        maxBoostFeeBps = 0,
      } = swapParams;

      if (!(sellAssetString && buyAssetString)) {
        throw new SwapKitError("core_swap_asset_not_recognized");
      }

      const sellAsset = await AssetValue.from({
        asyncTokenLookup: true,
        asset: sellAssetString,
        value: sellAmount,
      });

      const wallet = getWallet(sellAsset.chain as CryptoChain);

      if (!wallet) {
        throw new SwapKitError("core_wallet_connection_not_found");
      }

      const { depositAddress } = await SwapKitApi.getChainflipDepositChannel({
        ...chainflip,
        destinationAddress: recipient || chainflip.destinationAddress,
        maxBoostFeeBps: maxBoostFeeBps || chainflip.maxBoostFeeBps,
      });

      // @ts-expect-error TODO: right now it's inferred from toolboxes
      // we need to simplify this to one object params
      const tx = await wallet.transfer({
        assetValue: sellAsset,
        sender: wallet.address,
        recipient: depositAddress,
        isProgramDerivedAddress: true,
      });

      return tx as string;
    },
  }),
  properties: {
    supportedSwapkitProviders: [ProviderName.CHAINFLIP, ProviderName.CHAINFLIP_STREAMING],
  },
});
