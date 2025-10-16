"use client";

import {
  AssetValue,
  type Chain,
  ProviderName,
  type QuoteResponseRoute,
  SwapKitApi,
  useSwapKitConfig,
  useSwapKitStore,
} from "@swapkit/sdk";
import { ArrowDownUpIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { getStableConfigMemoKey } from "../utils";
import { SwapInputWithChainSelector } from "./components/composable/swap-input-chain-selector";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Toaster, toast } from "./components/ui/sonner";
import { useDebouncedEffect } from "./hooks/use-debounced-effect";
import { useSwapKit } from "./swapkit-context";
import type { SwapKitWidgetProps } from "./types";

export function SwapKitWidget({ config }: SwapKitWidgetProps) {
  const [inputAsset, setInputAsset] = useState<string>("NEAR.USDT-usdt.tether-token.near");
  const [outputAsset, setOutputAsset] = useState<string>("THOR.RUNE");
  const [amount, setAmount] = useState("4.20");
  const [isSwapping, setIsSwapping] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState<string>();
  const [routes, setRoutes] = useState<QuoteResponseRoute[]>([]);
  const cachedStableConfigMemoKey = useRef<string | null>(null);

  const swapKitConfig = useSwapKitConfig();
  const { setConfig } = useSwapKitStore();
  const { swapKit, isWalletConnected } = useSwapKit();

  const stableConfigMemoKey = getStableConfigMemoKey(config);

  const updateEstimatedOutput = async () => {
    const sourceAddress = swapKit?.getAddress?.(inputAsset?.split?.(".")?.[0] as Chain);
    const destinationAddress = swapKit?.getAddress?.(outputAsset?.split?.(".")?.[0] as Chain);

    if (!(inputAsset && outputAsset && amount && swapKit && sourceAddress && destinationAddress)) {
      setEstimatedOutput(undefined);
      setRoutes([]);
      return;
    }

    try {
      const quote = await SwapKitApi.getSwapQuote({
        buyAsset: outputAsset,
        destinationAddress,
        includeTx: true,
        sellAmount: amount,
        sellAsset: inputAsset,
        slippage: 3,
        sourceAddress,
      });

      if (quote?.routes?.length <= 0) return;

      setRoutes(quote.routes);
      setEstimatedOutput(quote?.routes?.[0]?.expectedBuyAmount);
    } catch (error) {
      console.error("Failed to get quote:", error);
      toast.error(`Failed to get quote: ${error instanceof Error ? error.message : "Unknown error"}`);
      setEstimatedOutput(undefined);
      setRoutes([]);
    }
  };

  useDebouncedEffect(updateEstimatedOutput, [inputAsset, outputAsset, amount, swapKit, swapKitConfig], 1000);

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger only on primitive values change, so we don't need widget users to remember about memoizing config objects
  useEffect(() => {
    if (!config) return;

    const isConfigSame = cachedStableConfigMemoKey?.current === stableConfigMemoKey;

    if (swapKit && isConfigSame) return;

    setConfig(config);

    cachedStableConfigMemoKey.current = stableConfigMemoKey;
  }, [swapKit, stableConfigMemoKey, setConfig]);

  const handleSwap = async (route: QuoteResponseRoute) => {
    if (!swapKit) return;

    try {
      setIsSwapping(true);
      const swap = await swapKit.swap({ route });

      await swap.wait();
      setAmount("");
      setEstimatedOutput(undefined);
      setRoutes([]);
      toast.success("Swap completed successfully");
    } catch (error) {
      console.error("Swap failed:", error);
      toast.error(`Swap failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const swap = async (route: QuoteResponseRoute, inputAssetValue?: AssetValue) => {
    if (!(inputAssetValue && swapKit)) return;

    try {
      const isChainflip = route?.providers?.includes(ProviderName.CHAINFLIP);
      if (isChainflip) {
        await handleSwap(route);
        return;
      }

      const tx = route.tx;
      if (!tx || typeof tx === "string" || !("from" in tx)) {
        throw new Error("Invalid transaction format");
      }

      const isApproved = await swapKit.isAssetValueApproved(inputAssetValue, tx.from);
      if (isApproved) {
        await handleSwap(route);
      } else {
        await swapKit.approveAssetValue(inputAssetValue, tx.from);
        toast.success("Asset approved, you can now swap");
      }
    } catch (error) {
      console.error("Swap process failed:", error);
      toast.error(`Swap process failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleSubmitButtonClick = async () => {
    if (!(routes?.length && inputAsset)) return;

    try {
      const assetValue = await AssetValue.from({ amount, asset: inputAsset, asyncTokenLookup: true });
      const amountValue = assetValue.set(amount);

      const route = routes?.[0];

      if (!route) return;

      await swap(route, amountValue);
    } catch (error) {
      console.error("Failed to prepare swap:", error);
      toast.error(`Failed to prepare swap: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const submitButtonContent = match({ amount, inputAsset, isSwapping, isWalletConnected, outputAsset })
    .with({ isSwapping: true }, () => (
      <>
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        Swapping...
      </>
    ))
    .with({ isWalletConnected: false }, () => "Connect wallet")
    .with({ inputAsset: P.nullish }, { outputAsset: P.nullish }, () => "Select Assets")
    .with({ amount: P.nullish }, () => "Enter Amount")
    .otherwise(() => "Swap");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-medium text-2xl">Swap</h1>

      <Card>
        <CardContent className="grid gap-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              <SwapInputWithChainSelector
                amount={amount}
                isSwapping={isSwapping}
                label="Pay"
                selectedAsset={inputAsset}
                setAmount={setAmount}
                setSelectedAsset={setInputAsset}
              />

              <div className="-my-4 flex items-center space-x-4">
                <span className="h-px w-full bg-border" />

                <Button
                  className="size-10 shrink-0 rounded-full"
                  onClick={() => {
                    const temp = inputAsset;
                    setInputAsset(outputAsset);
                    setOutputAsset(temp);
                  }}
                  size="unstyled"
                  variant="tertiary">
                  <ArrowDownUpIcon className="size-6" />
                </Button>

                <span className="h-px w-full bg-border" />
              </div>

              <SwapInputWithChainSelector
                amount={estimatedOutput}
                isSwapping={isSwapping}
                label="Receive"
                selectedAsset={outputAsset}
                setSelectedAsset={setOutputAsset}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        disabled={!(inputAsset && outputAsset && amount) || isSwapping || !isWalletConnected}
        onClick={handleSubmitButtonClick}
        size="xl"
        variant="primary">
        {submitButtonContent}
      </Button>

      <Toaster position="bottom-right" />
    </div>
  );
}
