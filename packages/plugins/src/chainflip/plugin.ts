import {
  AssetValue,
  type EVMWallets,
  ProviderName,
  SKConfig,
  type SolanaWallets,
  type SubstrateWallets,
  SwapKitError,
  type UTXOWallets,
  createPlugin,
} from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";
import type { RequestSwapDepositAddressParams } from "./types";

type SupportedChain = keyof (EVMWallets & SubstrateWallets & UTXOWallets & SolanaWallets);

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

      const wallet = getWallet(sellAsset.chain as SupportedChain);

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
        from: wallet.address,
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
