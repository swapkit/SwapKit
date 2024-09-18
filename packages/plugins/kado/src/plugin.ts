import { type AssetValue, RequestClient, type SwapKitPluginParams } from "@swapkit/helpers";
import { ChainToKadoChain } from "./helpers";

function plugin({
  getWallet,
  config: { kadoApiKey },
}: SwapKitPluginParams<{ kadoApiKey: string }>) {
  async function onRampQuote(assetValue: AssetValue, fiatCurrency: string) {
    const blockchain = ChainToKadoChain(assetValue.chain);
    if (!blockchain) {
      throw new Error(`Asset chain ${assetValue.chain} not supported by Kado`);
    }
    try {
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
        json: {
          transactionType: "buy",
          fiatMethod: "sepa", // Default to SEPA, can be made configurable
          partner: "fortress",
          amount: assetValue.getBaseValue("number"),
          asset: assetValue.symbol,
          blockchain,
          currency: fiatCurrency,
        },
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

  async function offRampQuote(assetValue: AssetValue, fiatCurrency: string) {
    const blockchain = ChainToKadoChain(assetValue.chain);
    if (!blockchain) {
      throw new Error("asset chain not supported");
    }
    try {
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
        json: {
          transactionType: "sell",
          fiatMethod: "sepa", // Default to ACH, can be made configurable
          partner: "fortress",
          amount: assetValue.getBaseValue("number"),
          asset: assetValue.symbol,
          blockchain,
          currency: fiatCurrency,
        },
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

  return {
    onRampQuote,
    offRampQuote,
    getBlockchains,
    getAssets,
    supportedSwapkitProviders: [],
  };
}

export const KadoPlugin = { kado: { plugin } } as const;
