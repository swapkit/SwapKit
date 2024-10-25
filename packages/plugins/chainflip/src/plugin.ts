import { type DepositAddressRequest, SwapSDK } from "@chainflip/sdk/swap";
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
import { assetTickerToChainflipAsset, chainToChainflipChain } from "./broker";
import type { RequestSwapDepositAddressParams } from "./types";

type SupportedChain = keyof (EVMWallets & SubstrateWallets & UTXOWallets & SolanaWallets);

export async function getDepositAddress({
  buyAsset,
  sellAsset,
  recipient,
  brokerEndpoint,
  maxBoostFeeBps,
  brokerCommissionBPS,
  ccmParams,
  ccmMetadata,
  fillOrKillParams,
  dcaParams,
  chainflipSDKBroker,
}: {
  buyAsset: AssetValue;
  sellAsset: AssetValue;
  recipient: string;
  brokerEndpoint: string;
  maxBoostFeeBps: number;
  brokerCommissionBPS?: number;
  ccmParams?: DepositAddressRequest["ccmParams"];
  ccmMetadata?: DepositAddressRequest["ccmMetadata"];
  dcaParams?: DepositAddressRequest["dcaParams"];
  fillOrKillParams?: DepositAddressRequest["fillOrKillParams"];
  chainflipSDKBroker?: boolean;
}) {
  try {
    if (chainflipSDKBroker) {
      const chainflipSDK = new SwapSDK({
        broker: { url: brokerEndpoint, commissionBps: brokerCommissionBPS || 0 },
        network: "mainnet",
      });

      const srcAsset = assetTickerToChainflipAsset.get(sellAsset.ticker);
      const srcChain = chainToChainflipChain.get(sellAsset.chain);
      const destAsset = assetTickerToChainflipAsset.get(buyAsset.ticker);
      const destChain = chainToChainflipChain.get(buyAsset.chain);

      if (!(srcAsset && srcChain && destAsset && destChain)) {
        throw new SwapKitError("chainflip_unknown_asset", { sellAsset, buyAsset });
      }

      const resp = await chainflipSDK.requestDepositAddress({
        destAddress: recipient,
        srcAsset,
        srcChain,
        destAsset,
        destChain,
        amount: sellAsset.getBaseValue("string"),
        maxBoostFeeBps,
        ccmParams,
        ccmMetadata,
        fillOrKillParams,
        dcaParams,
      });

      return {
        channelId: resp.depositChannelId,
        depositAddress: resp.depositAddress,
        chain: buyAsset.chain,
      };
    }

    const response = await fetch(brokerEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyAsset: buyAsset.toString(),
        sellAsset: sellAsset.toString(),
        destinationAddress: recipient,
        maxBoostFeeBps,
        ccmParams,
        ccmMetadata,
        fillOrKillParams,
        dcaParams,
      }),
    }).then((res) => res.json());

    if (chainflipSDKBroker && "error" in response.data) {
      throw new Error(`RPC error [${response.data.error.code}]: ${response.data.error.message}`);
    }

    return response as {
      channelId: string;
      depositAddress: string;
      chain: string;
    };
  } catch (error) {
    throw new SwapKitError("chainflip_channel_error", error);
  }
}

function plugin({
  getWallet,
  config: { chainflipBrokerUrl: legacyChainflipBrokerUrl, chainflipBrokerConfig },
}: SwapKitPluginParams<{
  chainflipBrokerUrl?: string;
  chainflipBrokerConfig?: { chainflipBrokerUrl: string; useChainflipSDKBroker?: boolean };
}>) {
  async function swap(swapParams: RequestSwapDepositAddressParams) {
    const { chainflipBrokerUrl, useChainflipSDKBroker } = chainflipBrokerConfig || {};

    const brokerUrl = chainflipBrokerUrl || legacyChainflipBrokerUrl;

    if (!(swapParams?.route?.buyAsset && brokerUrl)) {
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

    const buyAsset = await AssetValue.from({ asyncTokenLookup: true, asset: buyAssetString });

    const { depositAddress } = await getDepositAddress({
      brokerEndpoint: brokerUrl,
      buyAsset,
      recipient,
      sellAsset,
      maxBoostFeeBps,
      chainflipSDKBroker: useChainflipSDKBroker,
      ...(chainflip ? chainflip : {}),
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
    getDepositAddress,
    supportedSwapkitProviders: [ProviderName.CHAINFLIP],
  };
}

export const ChainflipPlugin = { chainflip: { plugin } } as const;

/**
 * @deprecated Use import { ChainflipPlugin } from "@swapkit/plugin-chainflip" instead
 */
export const ChainflipProvider = ChainflipPlugin;
