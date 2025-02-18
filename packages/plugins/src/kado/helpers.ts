import { type AssetValue, Chain, FeeTypeEnum, ProviderName, blockTimes } from "@swapkit/helpers";
import type { QuoteResponse, QuoteResponseRoute } from "@swapkit/helpers/api";
import type { KadoQuoteResponse } from "./types";

export const SupportedKadoChain = {
  thorchain: Chain.THORChain,
  solana: Chain.Solana,
  polygon: Chain.Polygon,
  Optimism: Chain.Optimism,
  litecoin: Chain.Litecoin,
  kujira: Chain.Kujira,
  ethereum: Chain.Ethereum,
  "cosmos hub": Chain.Cosmos,
  bitcoin: Chain.Bitcoin,
  base: Chain.Base,
  Avalanche: Chain.Avalanche,
  Arbitrum: Chain.Arbitrum,
};

export function ChainToKadoChain(chain: Chain) {
  const entries = Object.entries(SupportedKadoChain);
  const found = entries.find(([_, value]) => value === chain);
  if (!found) throw new Error(`Chain ${chain} not supported`);
  return found[0];
}

export function KadoChainToChain(kadoChain: string) {
  const found = Object.keys(SupportedKadoChain).includes(kadoChain);
  if (!found) throw new Error(`KadoChain ${kadoChain} not supported`);
  return SupportedKadoChain[kadoChain as keyof typeof SupportedKadoChain];
}

export function mapKadoQuoteToQuoteResponse({
  quote,
  sellAsset,
  buyAsset,
}: { quote: KadoQuoteResponse; sellAsset: AssetValue; buyAsset: AssetValue }): QuoteResponse {
  const sellAssetChain = sellAsset.chain;
  const buyAssetChain = buyAsset.chain;
  const isOnRamp = sellAssetChain === Chain.Fiat;
  const { receive, price, baseAmount, totalFee, processingFee, networkFee } = quote.data.quote;

  const buyAssetAmount = buyAsset.set(
    isOnRamp ? receive.unitCount.toString() : receive.amount.toString(),
  );
  const totalSlippageBps = isOnRamp
    ? Math.round((totalFee.amount / receive.amount) * 10_000)
    : Math.round((totalFee.amount / (price.price * baseAmount.amount)) * 10_000);

  const inbound = Math.ceil(blockTimes[sellAssetChain] * 3);
  const swap = Math.ceil(60);
  const outbound = Math.ceil(blockTimes[buyAssetChain]);
  const routes: QuoteResponseRoute[] = [
    {
      buyAsset: buyAsset.toString(),
      destinationAddress: "{destinationAddress}",
      estimatedTime: { inbound, swap, outbound, total: inbound + swap + outbound },
      expectedBuyAmount: buyAssetAmount.getValue("string"),
      expectedBuyAmountMaxSlippage: buyAssetAmount.getValue("string"),
      providers: [ProviderName.KADO],
      sellAmount: sellAsset.getValue("string"),
      sellAsset: sellAsset.toString(),
      sourceAddress: "{sourceAddress}",
      totalSlippageBps,
      fees: [
        {
          asset: processingFee.currency,
          amount: processingFee.amount.toString(),
          type: FeeTypeEnum.LIQUIDITY,
          protocol: ProviderName.KADO,
          chain: Chain.Fiat,
        },
        {
          asset: networkFee.currency,
          amount: networkFee.amount.toString(),
          type: FeeTypeEnum.NETWORK,
          protocol: ProviderName.KADO,
          chain: buyAsset.chain,
        },
      ],
      legs: [
        {
          provider: ProviderName.KADO,
          sellAsset: sellAsset.toString(),
          sellAmount: sellAsset.getValue("string"),
          buyAsset: buyAsset.toString(),
          buyAmount: receive.unitCount.toString(),
          buyAmountMaxSlippage: receive.unitCount.toString(),
          fees: [
            {
              asset: processingFee.currency,
              amount: processingFee.amount.toString(),
              type: FeeTypeEnum.LIQUIDITY,
              protocol: ProviderName.KADO,
              chain: Chain.Fiat,
            },
            {
              asset: networkFee.currency,
              amount: networkFee.amount.toString(),
              type: FeeTypeEnum.NETWORK,
              protocol: ProviderName.KADO,
              chain: buyAsset.chain,
            },
          ],
        },
      ],
      warnings: [],
      meta: { tags: [] },
    },
  ];

  return {
    quoteId: crypto.randomUUID(),
    routes,
    error: quote.success ? undefined : quote.message,
  };
}
