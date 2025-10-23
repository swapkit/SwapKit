"use client";

import { AssetValue, type PriceResponse, type QuoteResponse, SwapKitApi, useSwapKitConfig } from "@swapkit/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "../../lib/utils";
import { temp_host } from "../components/asset-icon";
import { SWAPKIT_WIDGET_TOASTER_ID } from "../components/ui/sonner";
import { useSwapKit } from "../swapkit-context";
import type { UseSwapQuoteParams } from "../types";
import { useDebouncedEffect } from "./use-debounced-effect";

export const useSwapQuote = ({ inputAsset, outputAsset, amount }: UseSwapQuoteParams) => {
  const [quoteResponse, setQuoteResponse] = useState<QuoteResponse | null>(null);
  const [priceResponse, setPriceResponse] = useState<PriceResponse | null>(null);
  const [selectedQuoteRouteIndex, setSelectedQuoteRouteIndex] = useState(0);

  const { swapKit } = useSwapKit();
  const swapKitConfig = useSwapKitConfig();

  const selectedQuoteRoute = useMemo(() => {
    return quoteResponse?.routes?.[selectedQuoteRouteIndex] ?? null;
  }, [quoteResponse, selectedQuoteRouteIndex]);

  const inputAssetValue = useMemo(() => {
    if (!inputAsset) return null;

    return AssetValue.from({ asset: inputAsset });
  }, [inputAsset]);

  const outputAssetValue = useMemo(() => {
    if (!outputAsset) return null;

    return AssetValue.from({ asset: outputAsset });
  }, [outputAsset]);

  useEffect(() => {
    if (!inputAsset || !outputAsset || !swapKitConfig?.apiKeys?.swapKit) return;

    void SwapKitApi.getPrice({
      metadata: false,
      tokens: [{ identifier: inputAsset }, { identifier: outputAsset }],
    }).then((price) => setPriceResponse(price));
  }, [inputAsset, outputAsset, swapKitConfig?.apiKeys?.swapKit]);

  const outputAssetIdentifier = outputAssetValue?.toString();
  const inputAssetIdentifier = inputAssetValue?.toString();

  const fetchSwapQuote = useCallback(async () => {
    const isValid =
      amount &&
      swapKit &&
      inputAssetValue?.chain &&
      outputAssetValue?.chain &&
      outputAssetIdentifier &&
      inputAssetIdentifier;

    if (!isValid) {
      setQuoteResponse(null);
      return;
    }

    try {
      const quote = await SwapKitApi.getSwapQuote({
        buyAsset: outputAssetIdentifier,
        destinationAddress: swapKit.getAddress(outputAssetValue?.chain),
        includeTx: true,
        sellAmount: amount,
        sellAsset: inputAssetIdentifier,
        slippage: 3,
        sourceAddress: swapKit.getAddress(inputAssetValue?.chain),
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
  }, [amount, swapKit, outputAssetValue?.chain, inputAssetValue?.chain, inputAssetIdentifier, outputAssetIdentifier]);

  useDebouncedEffect(fetchSwapQuote, [amount, swapKitConfig, outputAsset, inputAsset], 1000);

  const formattedEstimatedTime = useMemo(() => {
    if (!selectedQuoteRoute?.estimatedTime?.total) return "00m 00s";

    const hours = Math.floor(selectedQuoteRoute?.estimatedTime?.total / 3600);
    const minutes = Math.floor((selectedQuoteRoute?.estimatedTime?.total % 3600) / 60);
    const seconds = selectedQuoteRoute?.estimatedTime?.total % 60;

    return `${hours ? `${hours.toFixed(0)}h ` : ""}${`${minutes.toFixed(0)}m `}${`${seconds.toFixed(0)}s`}`;
  }, [selectedQuoteRoute?.estimatedTime?.total]);

  const providerName = selectedQuoteRoute?.providers?.[0] || null;

  const getAssetPriceUSD = (asset: AssetValue) => {
    const assetIdentifier = asset.toString();

    const price = priceResponse?.find((p) => p.identifier === assetIdentifier)?.price_usd || null;

    return price;
  };

  const inputAssetPriceUSD = inputAssetValue && getAssetPriceUSD(inputAssetValue);
  const inputAssetTicker = inputAssetValue?.ticker || null;

  const outputAssetPriceUSD = outputAssetValue && getAssetPriceUSD(outputAssetValue);
  const outputAssetTicker = outputAssetValue?.ticker || null;

  const assetValueToUSD = (assetValue: AssetValue) => {
    const assetPriceUSD = getAssetPriceUSD(assetValue);

    if (!assetPriceUSD) return 0;

    return assetValue.getValue("number") * assetPriceUSD;
  };

  const totalFeesUSD =
    selectedQuoteRoute?.fees?.reduce(
      (acc, fee) => acc + assetValueToUSD(AssetValue.from({ asset: fee?.asset, value: fee?.amount })),
      0,
    ) || 0;

  const liquidityFee = selectedQuoteRoute?.fees?.find((fee) => fee.type === "liquidity");
  const liquidityFeeUSD = liquidityFee
    ? assetValueToUSD(AssetValue.from({ asset: liquidityFee?.asset, value: liquidityFee?.amount }))
    : null;

  const exchangeFee = selectedQuoteRoute?.fees?.find((fee) => fee.type === "affiliate");
  const exchangeFeeUSD = exchangeFee
    ? assetValueToUSD(AssetValue.from({ asset: exchangeFee?.asset, value: exchangeFee?.amount }))
    : null;

  const inboundNetworkFee = selectedQuoteRoute?.fees?.find((fee) => fee.type === "inbound");
  const inboundNetworkFeeUSD = inboundNetworkFee
    ? assetValueToUSD(AssetValue.from({ asset: inboundNetworkFee?.asset, value: inboundNetworkFee?.amount }))
    : null;

  const expectedBuyAmountMaxSlippage = selectedQuoteRoute?.expectedBuyAmountMaxSlippage || null;
  const expectedBuyAmount = selectedQuoteRoute?.expectedBuyAmount || null;

  const canShowFees = outputAssetPriceUSD && inputAssetPriceUSD;

  const swapQuote = useMemo(() => {
    // biome-ignore assist/source/useSortedKeys: sort by use case, not alphabetically
    return {
      inputAssetPriceUSD,
      inputAssetTicker,
      formattedInputAssetPriceUSD: inputAssetPriceUSD ? formatCurrency(inputAssetPriceUSD * Number(amount)) : "$0.00",

      outputAssetPriceUSD,
      outputAssetTicker,
      formattedOutputAssetPriceUSD:
        expectedBuyAmount && outputAssetPriceUSD
          ? formatCurrency(outputAssetPriceUSD * Number(expectedBuyAmount) - totalFeesUSD)
          : "$0.00",

      expectedBuyAmount,
      expectedBuyAmountMaxSlippage,

      formattedEstimatedTime,
      formattedExchangeFeeUSD: canShowFees ? formatCurrency(exchangeFeeUSD) : "-",
      formattedInboundNetworkFeeUSD: canShowFees ? formatCurrency(inboundNetworkFeeUSD) : "-",
      formattedLiquidityFeeUSD: canShowFees ? formatCurrency(liquidityFeeUSD) : "-",
      formattedTotalFeesUSD: canShowFees ? formatCurrency(totalFeesUSD) : "-",

      providerLogoURI: `${temp_host}/images/${providerName?.toLowerCase()}.png`,
      providerName,
    };
  }, [
    outputAssetPriceUSD,
    outputAssetTicker,
    expectedBuyAmount,
    expectedBuyAmountMaxSlippage,
    formattedEstimatedTime,
    exchangeFeeUSD,
    inboundNetworkFeeUSD,
    liquidityFeeUSD,
    totalFeesUSD,
    providerName,
    inputAssetPriceUSD,
    inputAssetTicker,
    canShowFees,
    amount,
  ]);

  return useMemo(
    () => ({ selectedQuoteRoute, setSelectedQuoteRouteIndex, swapQuote }),
    [selectedQuoteRoute, swapQuote],
  );
};
