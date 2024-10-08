import {
  type AssetValue,
  type Chain,
  ProviderName,
  RequestClient,
  type SwapKitPluginParams,
} from "@swapkit/helpers";
import { ChainToKadoChain } from "./helpers";

type KadoQuoteRequest = {
  transactionType: "buy" | "sell";
  fiatMethod:
    | "ach"
    | "debit_card"
    | "credit_card"
    | "apple_pay_credit"
    | "apple_pay_debit"
    | "wire"
    | "sepa"
    | "pix"
    | "koywe";
  partner: "fortress";
  amount: string;
  asset: string;
  blockchain: string;
  currency:
    | "USD"
    | "CAD"
    | "GBP"
    | "EUR"
    | "MXN"
    | "COP"
    | "INR"
    | "CHF"
    | "AUD"
    | "ARS"
    | "BRL"
    | "CLP"
    | "JPY"
    | "KRW"
    | "PEN"
    | "PHP"
    | "SGD"
    | "TRY"
    | "UYU"
    | "TWD"
    | "VND"
    | "CRC"
    | "SEK"
    | "PLN"
    | "DKK"
    | "NOK"
    | "NZD";
};

function plugin({
  getWallet,
  config: { kadoApiKey },
}: SwapKitPluginParams<{ kadoApiKey: string }>) {
  async function onRampQuote(assetValue: AssetValue, fiatCurrency: KadoQuoteRequest["currency"]) {
    const blockchain = ChainToKadoChain(assetValue.chain);
    if (!blockchain) {
      throw new Error(`Asset chain ${assetValue.chain} not supported by Kado`);
    }
    debugger;
    try {
      const quoteRequest: KadoQuoteRequest = {
        transactionType: "buy",
        fiatMethod: "sepa", // Default to SEPA, can be made configurable
        partner: "fortress",
        amount: assetValue.getValue("string"),
        asset: assetValue.symbol,
        blockchain,
        currency: fiatCurrency,
      };

      const quote = await RequestClient.get<{
        success: boolean;
        message: string;
        data: {
          quote: {
            receiveAmount: number;
            networkFee: number;
            processingFee: number;
            totalFee: number;
          };
        };
      }>("https://api.kado.money/v2/ramp/quote", {
        searchParams: quoteRequest,
        headers: {
          "X-Widget-Id": kadoApiKey,
        },
      });

      if (!quote.success) {
        throw new Error(quote.message);
      }

      return quote.data.quote;
    } catch (error) {
      throw new Error("core_swap_quote_error");
    }
  }

  async function offRampQuote(assetValue: AssetValue, fiatCurrency: KadoQuoteRequest["currency"]) {
    const blockchain = ChainToKadoChain(assetValue.chain);
    if (!blockchain) {
      throw new Error("asset chain not supported");
    }
    try {
      const quoteRequest: KadoQuoteRequest = {
        transactionType: "sell",
        fiatMethod: "sepa", // Default to SEPA, can be made configurable
        partner: "fortress",
        amount: assetValue.getBaseValue("number"),
        asset: assetValue.symbol,
        blockchain,
        currency: fiatCurrency,
      };

      const quote = await RequestClient.get<{
        success: boolean;
        message: string;
        data: {
          quote: {
            receiveAmount: number;
            networkFee: number;
            processingFee: number;
            totalFee: number;
          };
        };
      }>("https://api.kado.money/v2/ramp/quote", {
        json: quoteRequest,
        headers: {
          "X-Widget-Id": kadoApiKey,
        },
      });

      if (!quote.success) {
        throw new Error(quote.message);
      }

      return quote.data.quote;
    } catch (error) {
      throw new Error("core_swap_quote_error");
    }
  }

  async function getBlockchains() {
    const response = await RequestClient.get<{
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
    }>("https://api.kado.money/v1/ramp/blockchains");

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
    } catch (error) {
      throw new Error("Failed to get order status");
    }
  }

  function getKadoWidgetUrl({
    sellAssetValue,
    buyAssetValue,
    supportedAssets,
    recipient,
    networkList,
    type,
    typeList,
    widgetMode,
  }: {
    sellAssetValue: AssetValue;
    buyAssetValue: AssetValue;
    supportedAssets: AssetValue[];
    recipient: string;
    networkList: Chain[];
    type: "BUY" | "SELL";
    typeList: "BUY" | "SELL";
    widgetMode: "minimal" | "full";
  }) {
    const urlParams = new URLSearchParams({
      onPayAmount: sellAssetValue.getValue("string"),
      onPayCurrency: sellAssetValue.symbol,
      onRevCurrency: buyAssetValue.symbol,
      cryptoList: supportedAssets.map((asset) => asset.symbol).join(","),
      onToAddress: recipient,
      network: ChainToKadoChain(buyAssetValue.chain).toUpperCase(),
      networkList: networkList.map((chain) => ChainToKadoChain(chain).toUpperCase()).join(","),
      product: type,
      productList: typeList,
      mode: widgetMode,
    });

    return `https://app.kado.money/?${urlParams.toString()}`;
  }

  return {
    onRampQuote,
    offRampQuote,
    getBlockchains,
    getAssets,
    getOrderStatus,
    getKadoWidgetUrl,
    supportedSwapkitProviders: [ProviderName.KADO],
  };
}

export const KadoPlugin = { kado: { plugin } } as const;
