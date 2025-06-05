import { type QuoteResponseRoute, swapkitApiEndpoints } from "@swapkit/api";
import {
  AssetValue,
  type ConnectConfig,
  type EVMWallets,
  ProviderName,
  type SolanaWallets,
  type SubstrateWallets,
  SwapKitError,
  type SwapKitPluginParams,
  type SwapParams,
  type UTXOWallets,
} from "@swapkit/helpers";

type SupportedChain = keyof (EVMWallets & SubstrateWallets & UTXOWallets & SolanaWallets);

function plugin({
  getWallet,
  config: { swapkitApiKey, swapkitConfig },
}: SwapKitPluginParams<ConnectConfig>) {
  async function swap(swapParams: SwapParams<"near", QuoteResponseRoute>) {
    const {
      route: {
        buyAsset: buyAssetString,
        sellAsset: sellAssetString,
        sellAmount,
        meta: { near },
      },
    } = swapParams;

    if (!(sellAssetString && buyAssetString && near?.sellAsset)) {
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

    const { depositAddress } = await swapkitApiEndpoints.getNearDepositChannel({
      isDev: swapkitConfig?.isDev,
      body: {
        ...near,
      },
      apiKey: swapkitApiKey || swapkitConfig?.swapkitApiKey,
    });

    const tx = await wallet.transfer({
      assetValue: sellAsset,
      from: wallet.address,
      recipient: depositAddress,
      isProgramDerivedAddress: true,
    });

    return tx as string;
  }

  return {
    swap,
    supportedSwapkitProviders: [ProviderName.NEAR],
  };
}

export const NearPlugin = { near: { plugin } } as const;
