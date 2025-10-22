"use client";

import {
  AssetValue,
  type Chain,
  type PriceResponse,
  type ProviderName,
  type QuoteResponse,
  SwapKitApi,
  useSwapKitConfig,
} from "@swapkit/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { temp_host } from "../components/asset-icon";
import { SWAPKIT_WIDGET_TOASTER_ID } from "../components/ui/sonner";
import { useSwapKit } from "../swapkit-context";
import { useDebouncedEffect } from "./use-debounced-effect";

export type UseSwapQuoteResult = {
  swapQuote: {
    providerName: ProviderName | null;
    providerLogoURI: string | null;

    expectedBuyAmount: string | null;
    expectedBuyAmountMaxSlippage: string | null;

    formattedEstimatedTime: string | null;
    formattedExchangeFeeUSD: string | null;
    formattedInboundNetworkFeeUSD: string | null;
    formattedLiquidityFeeUSD: string | null;
    formattedTotalFeesUSD: string | null;

    sellAssetPriceUSD: number | null;
    sellAssetTicker: string | null;

    buyAssetPriceUSD: number | null;
    buyAssetTicker: string | null;

    totalFeesUSD: number | null;
  } | null;
  setSelectedQuoteRouteIndex: (index: number) => void;
};

type UseSwapQuoteParams = { inputChain: Chain | null; outputChain: Chain | null; amount: string };

export const useSwapQuote = ({ inputChain, outputChain, amount }: UseSwapQuoteParams): UseSwapQuoteResult => {
  const [quoteResponse, setQuoteResponse] = useState<QuoteResponse | null>(null);
  const [priceResponse, setPriceResponse] = useState<PriceResponse | null>(null);
  const [selectedQuoteRouteIndex, setSelectedQuoteRouteIndex] = useState(0);

  const { swapKit } = useSwapKit();
  const swapKitConfig = useSwapKitConfig();

  const selectedQuoteRoute = useMemo(() => {
    return quoteResponse?.routes?.[selectedQuoteRouteIndex] ?? null;
  }, [quoteResponse, selectedQuoteRouteIndex]);

  const sellAsset = selectedQuoteRoute?.sellAsset ? AssetValue.from({ asset: selectedQuoteRoute?.sellAsset }) : null;
  const buyAsset = selectedQuoteRoute?.buyAsset ? AssetValue.from({ asset: selectedQuoteRoute?.buyAsset }) : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: optimisation for fetching price only when primitive values change
  useEffect(() => {
    if (!sellAsset || !buyAsset) return;

    void SwapKitApi.getPrice({
      metadata: false,
      tokens: [
        { identifier: `${sellAsset?.chain}.${sellAsset?.ticker}` },
        { identifier: `${buyAsset?.chain}.${buyAsset?.ticker}` },
      ],
    }).then((price) => setPriceResponse(price));
  }, [selectedQuoteRoute?.sellAsset, selectedQuoteRoute?.buyAsset]);

  const fetchSwapQuote = useCallback(async () => {
    if (!(inputChain && outputChain && amount && swapKit)) {
      setQuoteResponse(null);
      return;
    }

    try {
      const quote = await SwapKitApi.getSwapQuote({
        buyAsset: AssetValue.from({ chain: outputChain }).toString(),
        destinationAddress: swapKit.getAddress(outputChain),
        includeTx: true,
        sellAmount: amount,
        sellAsset: AssetValue.from({ chain: inputChain }).toString(),
        slippage: 3,
        sourceAddress: swapKit.getAddress(inputChain),
      });

      if (quote?.routes?.length <= 0) return;

      setQuoteResponse(quote);
    } catch (error) {
      console.error("Failed to get quote:", error);
      toast.error(`Failed to get quote: ${error instanceof Error ? error.message : "Unknown error"}`, {
        toasterId: SWAPKIT_WIDGET_TOASTER_ID,
      });
      setQuoteResponse(null);
    }
  }, [outputChain, amount, swapKit, inputChain]);

  useDebouncedEffect(fetchSwapQuote, [amount, swapKitConfig, outputChain, inputChain], 1000);

  const formattedEstimatedTime = useMemo(() => {
    if (!selectedQuoteRoute?.estimatedTime?.total) return "00m 00s";

    const hours = Math.floor(selectedQuoteRoute?.estimatedTime?.total / 3600);
    const minutes = Math.floor((selectedQuoteRoute?.estimatedTime?.total % 3600) / 60);
    const seconds = selectedQuoteRoute?.estimatedTime?.total % 60;

    return `${hours ? `${hours.toFixed(0)}h ` : ""}${`${minutes.toFixed(0)}m `}${`${seconds.toFixed(0)}s`}`;
  }, [selectedQuoteRoute?.estimatedTime?.total]);

  const providerName = selectedQuoteRoute?.providers?.[0] || null;

  const getAssetPriceUSD = (asset: AssetValue) => {
    const assetIdentifier = `${asset?.chain}.${asset?.ticker}`;
    const price = priceResponse?.find((p) => p.identifier === assetIdentifier)?.price_usd || null;

    return price;
  };

  const sellAssetPriceUSD = sellAsset && getAssetPriceUSD(sellAsset);
  const sellAssetTicker = sellAsset?.ticker || null;

  const buyAssetPriceUSD = buyAsset && getAssetPriceUSD(buyAsset);
  const buyAssetTicker = buyAsset?.ticker || null;

  const assetValueToUSD = (assetValue: AssetValue) => {
    const assetPriceUSD = getAssetPriceUSD(assetValue);

    if (!assetPriceUSD) return 0;

    return assetValue.getValue("number") * assetPriceUSD;
  };

  const totalFeesUSD =
    selectedQuoteRoute?.fees?.reduce(
      (acc, fee) => acc + assetValueToUSD(AssetValue.from({ asset: fee.asset, value: fee.amount })),
      0,
    ) || 0;

  const liquidityFee = selectedQuoteRoute?.fees?.find((fee) => fee.type === "liquidity");
  const liquidityFeeUSD = liquidityFee
    ? assetValueToUSD(AssetValue.from({ asset: liquidityFee.asset, value: liquidityFee.amount }))
    : null;

  const exchangeFee = selectedQuoteRoute?.fees?.find((fee) => fee.type === "affiliate");
  const exchangeFeeUSD = exchangeFee
    ? assetValueToUSD(AssetValue.from({ asset: exchangeFee.asset, value: exchangeFee.amount }))
    : null;

  const inboundNetworkFee = selectedQuoteRoute?.fees?.find((fee) => fee.type === "inbound");
  const inboundNetworkFeeUSD = inboundNetworkFee
    ? assetValueToUSD(AssetValue.from({ asset: inboundNetworkFee.asset, value: inboundNetworkFee.amount }))
    : null;

  const expectedBuyAmountMaxSlippage = selectedQuoteRoute?.expectedBuyAmountMaxSlippage || null;
  const expectedBuyAmount = selectedQuoteRoute?.expectedBuyAmount || null;

  const canShowFees = buyAssetPriceUSD && sellAssetPriceUSD;

  const swapQuote = selectedQuoteRoute
    ? {
        buyAssetPriceUSD,
        buyAssetTicker,

        expectedBuyAmount,
        expectedBuyAmountMaxSlippage,

        formattedEstimatedTime,
        formattedExchangeFeeUSD: canShowFees ? formatCurrency(exchangeFeeUSD) : "-",
        formattedInboundNetworkFeeUSD: canShowFees ? formatCurrency(inboundNetworkFeeUSD) : "-",
        formattedLiquidityFeeUSD: canShowFees ? formatCurrency(liquidityFeeUSD) : "-",
        formattedTotalFeesUSD: canShowFees ? formatCurrency(totalFeesUSD) : "-",

        providerLogoURI: `${temp_host}/images/${providerName?.toLowerCase()}.png`,
        providerName,

        sellAssetPriceUSD,
        sellAssetTicker,
        totalFeesUSD,
      }
    : null;

  return { setSelectedQuoteRouteIndex: (index: number) => setSelectedQuoteRouteIndex(index), swapQuote };
};

function formatCurrency(amount: number | null) {
  console.log("amount", amount);

  return Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amount ?? 0);
}
