"use client";

import {
  AssetValue,
  type PriceResponse,
  PriorityLabel,
  type QuoteResponse,
  type QuoteResponseRoute,
  SwapKitApi,
  useSwapKitConfig,
} from "@swapkit/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "../../lib/utils";
import { temp_host } from "../components/asset-icon";
import { SWAPKIT_WIDGET_TOASTER_ID } from "../components/ui/sonner";
import { useSwapKit } from "../swapkit-context";
import type { UseSwapQuoteParams } from "../types";
import { useDebouncedEffect } from "./use-debounced-effect";

export type UseSwapQuoteReturn = ReturnType<typeof useSwapQuote>;

export const useSwapQuote = ({ inputAsset, outputAsset, amount }: UseSwapQuoteParams) => {
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quoteResponse, setQuoteResponse] = useState<QuoteResponse | null>(null);
  const [priceResponse, setPriceResponse] = useState<PriceResponse | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [expectedBuyAmountFor1Input, setExpectedBuyAmountFor1Input] = useState(0);

  const { swapKit } = useSwapKit();
  const swapKitConfig = useSwapKitConfig();

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
      setIsFetchingQuote(true);

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

      const recommendedRouteIndex =
        quote?.routes?.findIndex((route) => route?.meta?.tags?.includes(PriorityLabel.RECOMMENDED)) || 0;

      setSelectedRouteIndex(recommendedRouteIndex);
    } catch (error) {
      console.error("Failed to get quote:", error);
      toast.error(`Failed to get quote: ${error instanceof Error ? error.message : "Unknown error"}`, {
        toasterId: SWAPKIT_WIDGET_TOASTER_ID,
      });
      setQuoteResponse(null);
    } finally {
      setIsFetchingQuote(false);
    }
  }, [amount, swapKit, outputAssetValue?.chain, inputAssetValue?.chain, inputAssetIdentifier, outputAssetIdentifier]);

  useDebouncedEffect(fetchSwapQuote, [amount, swapKit, swapKitConfig, outputAsset, inputAsset], 700);

  useEffect(() => {
    const selectedRoute = quoteResponse?.routes?.[selectedRouteIndex];

    setExpectedBuyAmountFor1Input(
      selectedRoute?.expectedBuyAmount ? Number.parseFloat(selectedRoute?.expectedBuyAmount) / Number(amount) : 0,
    );

    setPriceResponse((oldPriceResponse) => {
      const newPriceResponse = [...(oldPriceResponse ?? [])];

      selectedRoute?.meta?.assets?.forEach((asset) => {
        const priceIndex = newPriceResponse?.findIndex((p) => p?.identifier === asset?.asset);

        if (priceIndex === -1) {
          newPriceResponse.push({ identifier: asset?.asset, price_usd: asset?.price });
          return;
        }

        newPriceResponse[priceIndex] = { ...newPriceResponse[priceIndex], price_usd: asset?.price };
      });

      return newPriceResponse;
    });
  }, [amount, quoteResponse?.routes, selectedRouteIndex]);

  const getAssetPriceUSD = useCallback(
    (asset: AssetValue) => {
      const assetIdentifier = asset.toString();

      const price = priceResponse?.find((p) => p.identifier === assetIdentifier)?.price_usd || null;

      return price;
    },
    [priceResponse],
  );

  const inputAssetPriceUSD = inputAssetValue && getAssetPriceUSD(inputAssetValue);
  const inputAssetTicker = inputAssetValue?.ticker || null;

  const swapQuoteRoutes = useMemo(() => {
    const formatEstimatedTime = (estimatedTime: QuoteResponseRoute["estimatedTime"]) => {
      if (!estimatedTime?.total) return "00m 00s";

      const hours = Math.floor(estimatedTime?.total / 3600);
      const minutes = Math.floor((estimatedTime?.total % 3600) / 60);
      const seconds = estimatedTime?.total % 60;

      return `${hours ? `${hours.toFixed(0)}h ` : ""}${`${minutes.toFixed(0)}m `}${`${seconds.toFixed(0)}s`}`;
    };

    const assetValueToUSD = (assetValue: AssetValue) => {
      const assetPriceUSD = getAssetPriceUSD(assetValue);

      if (!assetPriceUSD) return 0;

      return assetValue.getValue("number") * assetPriceUSD;
    };

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: @Drakeoon fix/split that function
    const parseQuoteResponseRoute = (quoteResponseRoute: QuoteResponseRoute, index: number) => {
      const formattedEstimatedTime = formatEstimatedTime(quoteResponseRoute?.estimatedTime);

      const providerName = quoteResponseRoute?.providers?.[0] || null;

      const outputAssetPriceUSD = outputAssetValue && getAssetPriceUSD(outputAssetValue);
      const outputAssetTicker = outputAssetValue?.ticker || null;

      const totalFeesUSD =
        quoteResponseRoute?.fees?.reduce(
          (acc, fee) => acc + assetValueToUSD(AssetValue.from({ asset: fee?.asset, value: fee?.amount })),
          0,
        ) || 0;

      const liquidityFee = quoteResponseRoute?.fees?.find((fee) => fee.type === "liquidity");
      const liquidityFeeUSD = liquidityFee
        ? assetValueToUSD(AssetValue.from({ asset: liquidityFee?.asset, value: liquidityFee?.amount }))
        : null;

      const exchangeFee = quoteResponseRoute?.fees?.find((fee) => fee.type === "affiliate");
      const exchangeFeeUSD = exchangeFee
        ? assetValueToUSD(AssetValue.from({ asset: exchangeFee?.asset, value: exchangeFee?.amount }))
        : null;

      const inboundNetworkFee = quoteResponseRoute?.fees?.find((fee) => fee.type === "inbound");
      const inboundNetworkFeeUSD = inboundNetworkFee
        ? assetValueToUSD(AssetValue.from({ asset: inboundNetworkFee?.asset, value: inboundNetworkFee?.amount }))
        : null;

      const expectedBuyAmountMaxSlippage = quoteResponseRoute?.expectedBuyAmountMaxSlippage || null;
      const expectedBuyAmount = Number.parseFloat(quoteResponseRoute?.expectedBuyAmount) || null;

      const canShowFees = outputAssetPriceUSD && inputAssetPriceUSD;

      // biome-ignore assist/source/useSortedKeys: sort by use case, not alphabetically
      return {
        routeIndex: index,
        route: quoteResponseRoute,
        tags: quoteResponseRoute?.meta?.tags,

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
    };

    return quoteResponse?.routes?.map(parseQuoteResponseRoute);
  }, [quoteResponse?.routes, outputAssetValue, getAssetPriceUSD, inputAssetPriceUSD]);

  const reset = useCallback(() => {
    setQuoteResponse(null);
    setSelectedRouteIndex(0);
  }, []);

  return useMemo(
    () => ({
      isFetchingQuote,
      reset,
      routes: swapQuoteRoutes,
      selectedRoute: {
        ...(swapQuoteRoutes?.[selectedRouteIndex] ?? null),
        amount,
        expectedBuyAmountFor1Input,
        formattedInputAssetPriceUSD: inputAssetPriceUSD ? formatCurrency(inputAssetPriceUSD * Number(amount)) : "$0.00",
        inputAssetPriceUSD,
        inputAssetTicker,
      },
      setSelectedRouteIndex,
    }),
    [
      swapQuoteRoutes,
      selectedRouteIndex,
      amount,
      inputAssetPriceUSD,
      inputAssetTicker,
      reset,
      isFetchingQuote,
      expectedBuyAmountFor1Input,
    ],
  );
};
