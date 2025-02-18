import {
  AssetValue,
  Chain,
  ProviderName,
  RequestClient,
  SKConfig,
  type SwapParams,
  createPlugin,
  warnOnce,
} from "@swapkit/helpers";
import type { QuoteResponse, QuoteResponseRoute } from "@swapkit/helpers/api";
import { ChainToKadoChain, mapKadoQuoteToQuoteResponse } from "./helpers";
import type {
  KadoAssetsResponse,
  KadoBlockchainsResponse,
  KadoFiatCurrency,
  KadoFiatMethod,
  KadoQuoteRequest,
  KadoQuoteResponse,
} from "./types";

export const KadoPlugin = createPlugin({
  name: "kado",
  methods: () => ({
    createPopover,
    getAssets,
    getBlockchains,
    getKadoWidgetUrl,
    getOrderStatus,
    fetchProviderQuote,
    swap,
  }),
  properties: {
    supportedSwapkitProviders: [ProviderName.KADO],
  },
});

function swap({ route }: SwapParams<"evm", QuoteResponseRoute>) {
  if (!(route.sourceAddress && route.destinationAddress)) {
    throw new Error("Source and destination addresses are required");
  }

  const sellAsset = AssetValue.from({ asset: route.sellAsset });
  const buyAsset = AssetValue.from({ asset: route.buyAsset });

  // Determine if this is a buy or sell operation
  const type = sellAsset.chain === Chain.Fiat ? "buy" : "sell";

  const url = getKadoWidgetUrl({
    sellAsset,
    buyAsset,
    recipient: route.destinationAddress,
    sender: route.sourceAddress,
    type,
    mode: "minimal",
  });

  createPopover(url);

  return {
    status: "pending",
    txHash: null,
  };
}

async function fetchProviderQuote({
  sellAsset,
  buyAsset,
  fiatMethod = "credit_card",
}: {
  sellAsset: AssetValue;
  buyAsset: AssetValue;
  fiatMethod: KadoFiatMethod;
}): Promise<QuoteResponse> {
  try {
    const isOnRamp = sellAsset.chain === Chain.Fiat;
    const [paymentAsset, receiveAsset] = isOnRamp ? [buyAsset, sellAsset] : [sellAsset, buyAsset];
    const transactionType = isOnRamp ? "buy" : "sell";

    const quoteRequest: KadoQuoteRequest = {
      amount: paymentAsset.getValue("string"),
      asset: paymentAsset.symbol,
      blockchain: ChainToKadoChain(paymentAsset.chain),
      currency: receiveAsset.symbol as KadoFiatCurrency,
      fiatMethod,
      partner: "fortress",
      transactionType,
    };

    const kadoApiKey = SKConfig.get("apiKeys").kado;
    warnOnce(!kadoApiKey, "plugin(kado): No Kado API key found");

    const quote = await RequestClient.get<KadoQuoteResponse>(
      "https://api.kado.money/v2/ramp/quote",
      { searchParams: quoteRequest, headers: { "X-Widget-Id": kadoApiKey } },
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
  const response = await RequestClient.get<KadoAssetsResponse>(
    "https://api.kado.money/v1/ramp/supported-assets",
  );

  if (!response.success) {
    throw new Error(response.message);
  }

  return response.data.assets;
}

async function getOrderStatus(orderId: string) {
  const kadoApiKey = SKConfig.get("apiKeys").kado;
  warnOnce(!kadoApiKey, "plugin(kado): No Kado API key found");

  try {
    const response = await RequestClient.get<{
      success: boolean;
      message: string;
      data: { order: { status: string } };
    }>(`https://api.kado.money/v2/public/orders/${orderId}`, {
      headers: { "X-Widget-Id": kadoApiKey },
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
  recipient,
  type,
  sender,
  mode,
}: {
  sellAsset: AssetValue;
  buyAsset: AssetValue;
  recipient?: string;
  sender?: string;
  type: "buy" | "sell";
  mode: "minimal" | "full";
}) {
  const kadoApiKey = SKConfig.get("apiKeys").kado;
  warnOnce(!kadoApiKey, "plugin(kado): No Kado API key found");

  const buySellParams =
    type === "buy"
      ? {
          onPayAmount: sellAsset.getValue("string"),
          onPayCurrency: sellAsset.symbol,
          onRevCurrency: buyAsset.symbol,
          ...(recipient ? { onToAddress: recipient } : {}),
        }
      : {
          offPayAmount: sellAsset.getValue("string"),
          offPayCurrency: sellAsset.symbol,
          offRevCurrency: buyAsset.symbol,
          ...(sender ? { offFromAddress: sender } : {}),
        };
  const network = ChainToKadoChain(type === "buy" ? buyAsset.chain : sellAsset.chain).toUpperCase();
  const urlParams = new URLSearchParams({
    ...buySellParams,
    apiKey: kadoApiKey,
    network,
    product: type.toUpperCase(),
    mode,
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
