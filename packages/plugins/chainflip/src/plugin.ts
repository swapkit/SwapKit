import { swapkitApiEndpoints } from "@swapkit/api";
import {
  AssetValue,
  type EVMWallets,
  ProviderName,
  type SolanaWallets,
  type SubstrateWallets,
  SwapKitError,
  type SwapKitPluginParams,
  type UTXOWallets,
} from "@swapkit/helpers";
import type { RequestSwapDepositAddressParams } from "./types";

type SupportedChain = keyof (EVMWallets & SubstrateWallets & UTXOWallets & SolanaWallets);

function plugin({
  getWallet,
  config: { chainflipBrokerUrl: legacyChainflipBrokerUrl, chainflipBrokerConfig },
}: SwapKitPluginParams<{
  chainflipBrokerUrl?: string;
  chainflipBrokerConfig?: { chainflipBrokerUrl: string };
}>) {
  async function swap(swapParams: RequestSwapDepositAddressParams) {
    const { chainflipBrokerUrl } = chainflipBrokerConfig || {};

    const brokerUrl = chainflipBrokerUrl || legacyChainflipBrokerUrl;

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

    const { depositAddress } = await swapkitApiEndpoints.getChainflipDepositChannel({
      body: {
        ...chainflip,
        destinationAddress: recipient || chainflip.destinationAddress,
        maxBoostFeeBps: maxBoostFeeBps || chainflip.maxBoostFeeBps,
      },
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
    supportedSwapkitProviders: [ProviderName.CHAINFLIP],
  };
}

export const ChainflipPlugin = { chainflip: { plugin } } as const;

/**
 * @deprecated Use import { ChainflipPlugin } from "@swapkit/plugin-chainflip" instead
 */
export const ChainflipProvider = ChainflipPlugin;
