import type { QuoteResponse, QuoteResponseRoute } from "@swapkit/api";
import {
  AssetValue,
  Chain,
  FeeTypeEnum,
  ProviderName,
  RequestClient,
  blockTimes,
} from "@swapkit/helpers";
import type { SwapKitPluginParams, SwapParams } from "@swapkit/helpers";
import { ChainToKadoChain } from "./helpers";
import type {
  KadoFiatCurrency,
  KadoFiatMethod,
  KadoQuoteRequest,
  KadoQuoteResponse,
} from "./types";

function mapKadoQuoteToQuoteResponse({
  quote,
  sellAsset,
  buyAsset,
}: {
  quote: KadoQuoteResponse;
  sellAsset: AssetValue;
  buyAsset: AssetValue;
}): QuoteResponse {
  const isOnRamp = sellAsset.chain === Chain.Fiat;

  const buyAssetAmount = buyAsset.set(
    isOnRamp
      ? quote.data.quote.receive.unitCount.toString()
      : quote.data.quote.receive.amount.toString(),
  );
  const totalSlippageBps = isOnRamp
    ? Math.round((quote.data.quote.totalFee.amount / quote.data.quote.receive.amount) * 10_000)
    : Math.round(
        (quote.data.quote.totalFee.amount /
          (quote.data.quote.price.price * quote.data.quote.baseAmount.amount)) *
          10_000,
      );

  const inboundChain = sellAsset.chain;
  const outboundChain = buyAsset.chain;

  const inbound = Math.ceil(blockTimes[inboundChain] * 3);
  const swap = Math.ceil(60);
  const outbound = Math.ceil(blockTimes[outboundChain]);
  const routes: QuoteResponseRoute[] = [
    {
      providers: [ProviderName.KADO],
      sellAsset: sellAsset.toString(),
      sellAmount: sellAsset.getValue("string"),
      buyAsset: buyAsset.toString(),
      expectedBuyAmount: buyAssetAmount.getValue("string"),
      expectedBuyAmountMaxSlippage: buyAssetAmount.getValue("string"),
      sourceAddress: "{sourceAddress}",
      destinationAddress: "{destinationAddress}",
      fees: [
        {
          asset: quote.data.quote.processingFee.currency,
          amount: quote.data.quote.processingFee.amount.toString(),
          type: FeeTypeEnum.LIQUIDITY,
          protocol: ProviderName.KADO,
          chain: Chain.Fiat,
        },
        {
          asset: quote.data.quote.networkFee.currency,
          amount: quote.data.quote.networkFee.amount.toString(),
          type: FeeTypeEnum.NETWORK,
          protocol: ProviderName.KADO,
          chain: buyAsset.chain,
        },
      ],
      totalSlippageBps,
      legs: [
        {
          provider: ProviderName.KADO,
          sellAsset: sellAsset.toString(),
          sellAmount: sellAsset.getValue("string"),
          buyAsset: buyAsset.toString(),
          buyAmount: quote.data.quote.receive.unitCount.toString(),
          buyAmountMaxSlippage: quote.data.quote.receive.unitCount.toString(),
          fees: [
            {
              asset: quote.data.quote.processingFee.currency,
              amount: quote.data.quote.processingFee.amount.toString(),
              type: FeeTypeEnum.LIQUIDITY,
              protocol: ProviderName.KADO,
              chain: Chain.Fiat,
            },
            {
              asset: quote.data.quote.networkFee.currency,
              amount: quote.data.quote.networkFee.amount.toString(),
              type: FeeTypeEnum.NETWORK,
              protocol: ProviderName.KADO,
              chain: buyAsset.chain,
            },
          ],
        },
      ],
      warnings: [],
      meta: {
        tags: [],
      },
      estimatedTime: {
        inbound,
        swap,
        outbound,
        total: inbound + swap + outbound,
      },
    },
  ];

  return {
    quoteId: crypto.randomUUID(),
    routes,
    error: quote.success ? undefined : quote.message,
  };
}

export type KadoBlockchainsResponse = {
  success: boolean;
  message: string;
  data: {
    blockchains: {
      _id: string;
      supportedEnvironment: string;
      network: string;
      origin: string;
      label: string;
      associatedAssets: {
        _id: string;
        name: string;
        description: string;
        label: string;
        supportedProviders: string[];
        stablecoin: boolean;
        liveOnRamp: boolean;
        createdAt: string;
        updatedAt: string;
        __v: number;
        priority: number;
      };
      avgTransactionTimeSeconds: number;
      usesAvaxRouter: boolean;
      liveOnRamp: boolean;
      createdAt: string;
      updatedAt: string;
      __v: number;
      priority: number;
    }[];
  };
};

export type KadoSupportedAssetsResponse = {
  success: boolean;
  message: string;
  data: {
    assets: {
      _id: string;
      name: string;
      description: string;
      label: string;
      symbol: string;
      supportedProviders: string[];
      stablecoin: boolean;
      liveOnRamp: boolean;
      createdAt: string;
      updatedAt: string;
      __v: number;
      priority: number;
    }[];
  };
};

function plugin({ config: { kadoApiKey } }: SwapKitPluginParams<{ kadoApiKey: string }>) {
  async function fetchProviderQuote({
    sellAsset,
    buyAsset,
    fiatMethod,
  }: {
    sellAsset: AssetValue;
    buyAsset: AssetValue;
    fiatMethod: KadoFiatMethod;
  }): Promise<QuoteResponse> {
    try {
      const isOnRamp = sellAsset.chain === Chain.Fiat;

      const transactionType = isOnRamp ? "buy" : "sell";

      const currency = (isOnRamp ? sellAsset.symbol : buyAsset.symbol) as KadoFiatCurrency;

      const asset = isOnRamp ? buyAsset : sellAsset;

      const quoteRequest: KadoQuoteRequest = {
        transactionType,
        fiatMethod,
        partner: "fortress",
        amount: sellAsset.getValue("string"),
        asset: asset.symbol,
        blockchain: ChainToKadoChain(asset.chain),
        currency,
      };

      const quote = await RequestClient.get<KadoQuoteResponse>(
        "https://api.kado.money/v2/ramp/quote",
        {
          searchParams: quoteRequest,
          headers: {
            "X-Widget-Id": kadoApiKey,
          },
        },
      );

      if (!quote.success) {
        throw new Error(quote.message);
      }

      return mapKadoQuoteToQuoteResponse({ quote, sellAsset, buyAsset });
    } catch (_) {
      throw new Error("core_swap_quote_error");
    }
  }

  async function getBlockchains() {
    const response = await RequestClient.get<KadoBlockchainsResponse>(
      "https://api.kado.money/v1/ramp/blockchains",
    );

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.data.blockchains;
  }

  async function getAssets() {
    const response = await RequestClient.get<{
      success: boolean;
      message: string;
      data: {
        assets: {
          _id: string;
          name: string;
          description: string;
          label: string;
          symbol: string;
          supportedProviders: string[];
          stablecoin: boolean;
          liveOnRamp: boolean;
          createdAt: string;
          updatedAt: string;
          __v: number;
          priority: number;
        }[];
      };
    }>("https://api.kado.money/v1/ramp/supported-assets");

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.data.assets;
  }

  async function getOrderStatus(orderId: string) {
    try {
      const response = await RequestClient.get<{
        success: boolean;
        message: string;
        data: {
          order: {
            status: string;
            // Add other relevant fields from the API response
          };
        };
      }>(`https://api.kado.money/v2/public/orders/${orderId}`, {
        headers: {
          "X-Widget-Id": kadoApiKey,
        },
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      return response.data.order;
    } catch (_error) {
      throw new Error("Failed to get order status");
    }
  }

  function getKadoWidgetUrl({
    sellAsset,
    buyAsset,
    supportedAssets,
    recipient,
    networkList,
    type,
    typeList,
    widgetMode,
  }: {
    sellAsset: AssetValue;
    buyAsset: AssetValue;
    supportedAssets: AssetValue[];
    recipient: string;
    networkList: Chain[];
    type: "BUY" | "SELL";
    typeList: "BUY" | "SELL";
    widgetMode: "minimal" | "full";
  }) {
    const urlParams = new URLSearchParams({
      onPayAmount: sellAsset.getValue("string"),
      onPayCurrency: sellAsset.symbol,
      onRevCurrency: buyAsset.symbol,
      cryptoList: supportedAssets.map((asset) => asset.symbol).join(","),
      onToAddress: recipient,
      network: ChainToKadoChain(buyAsset.chain).toUpperCase(),
      networkList: networkList.map((chain) => ChainToKadoChain(chain).toUpperCase()).join(","),
      product: type,
      productList: typeList,
      mode: widgetMode,
    });

    return `https://app.kado.money/?${urlParams.toString()}`;
  }

  function createPopover(url: string) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.cssText = `
      width: 440px;
      height: 700px;
      border: none;
      border-radius: 12px;
      background: white;
    `;

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    return overlay;
  }

  function swap({ route }: SwapParams<"evm", QuoteResponseRoute>) {
    if (!(route.sourceAddress && route.destinationAddress)) {
      throw new Error("Source and destination addresses are required");
    }

    const sellAsset = AssetValue.from({ asset: route.sellAsset });
    const buyAsset = AssetValue.from({ asset: route.buyAsset });

    // Determine if this is a buy or sell operation
    const type = sellAsset.chain === Chain.Fiat ? "BUY" : "SELL";

    const url = getKadoWidgetUrl({
      sellAsset,
      buyAsset,
      supportedAssets: [sellAsset, buyAsset],
      recipient: route.destinationAddress,
      networkList: [buyAsset.chain],
      type,
      typeList: type,
      widgetMode: "minimal",
    });

    createPopover(url);

    return {
      status: "pending",
      txHash: null,
    };
  }

  return {
    fetchProviderQuote,
    getBlockchains,
    getAssets,
    getOrderStatus,
    getKadoWidgetUrl,
    swap,
    supportedSwapkitProviders: [ProviderName.KADO],
  };
}

export const KadoPlugin = { kado: { plugin } } as const;
