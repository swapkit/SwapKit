"use client";

import "@swapkit/ui/swapkit.css";

import { AssetValue, type QuoteResponseRoute, SwapKitApi, useSwapKitStore } from "@swapkit/sdk";
import { ArrowDownUpIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { getStableConfigMemoKey } from "../utils";
import { SwapInputWithChainSelector } from "./components/composable/swap-input-chain-selector";
import { SwapQuotePreview } from "./components/composable/swap-quote-preview";
import { SwapConfirmDialog } from "./components/dialogs/swap-confirm-dialog";
import { WalletConnectDialog } from "./components/dialogs/wallet-connect-dialog";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { SWAPKIT_WIDGET_TOASTER_ID, Toaster, toast } from "./components/ui/sonner";
import { ModalSpawner, showModal } from "./hooks/use-modal";
import { useSwapQuote } from "./hooks/use-swap-quote";
import { useSwapKit } from "./swapkit-context";
import type { SwapKitWidgetProps } from "./types";

export function SwapKitWidget({ config }: SwapKitWidgetProps) {
  const [amount, setAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [inputAsset, setInputAsset] = useState<string | null>("THOR.RUNE");
  const [outputAsset, setOutputAsset] = useState<string | null>("MAYA.MAYA");
  const cachedStableConfigMemoKey = useRef<string | null>(null);

  const { setConfig } = useSwapKitStore();
  const { swapKit, isWalletConnected } = useSwapKit();
  const { isFetchingQuote, selectedRoute, setSelectedRouteIndex, routes, reset } = useSwapQuote({
    amount,
    inputAsset,
    outputAsset,
  });

  const stableConfigMemoKey = getStableConfigMemoKey(config);

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger only on primitive values change, so we don't need widget users to remember about memoizing config objects
  useEffect(() => {
    const isConfigSame = cachedStableConfigMemoKey?.current === stableConfigMemoKey;

    if ((swapKit && isConfigSame) || !config) return;

    setConfig(config);

    cachedStableConfigMemoKey.current = stableConfigMemoKey;
  }, [swapKit, stableConfigMemoKey]);

  const performSwap = async (route: QuoteResponseRoute) => {
    try {
      setIsSwapping(true);

      const inputAssetValue = AssetValue.from({ asset: route?.sellAsset, value: route?.sellAmount });

      if (!inputAssetValue || !swapKit) {
        throw new Error("Invalid route parameters. Please check the route details and try again.");
      }

      const isApproved = await swapKit.isAssetValueApproved(inputAssetValue, route?.sourceAddress);

      if (!isApproved) {
        await swapKit.approveAssetValue(inputAssetValue, route?.sourceAddress);
      }

      const destinationAsset = AssetValue.from({ asset: route?.buyAsset });
      const sourceAsset = AssetValue.from({ asset: route?.sellAsset });

      const routeWithTx = await SwapKitApi.getRouteWithTx({
        destinationAddress: swapKit.getAddress(destinationAsset.chain),
        routeId: route.routeId,
        sourceAddress: swapKit.getAddress(sourceAsset.chain),
      });

      if (!routeWithTx) throw new Error("No route with TX found");

      if (
        !routeWithTx?.sourceAddress ||
        !routeWithTx?.destinationAddress ||
        Number.parseFloat(routeWithTx?.sellAmount) <= 0
      ) {
        throw new Error("Invalid route parameters. Please check the route details and try again.");
      }

      const swap = await swapKit.swap({ route: routeWithTx });

      await swap?.wait?.();

      toast.success("Swap transaction has been successfully submitted!", { toasterId: SWAPKIT_WIDGET_TOASTER_ID });
    } catch (error) {
      console.error("Swap process failed:", error);
      toast.error(`Swap process failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
        toasterId: SWAPKIT_WIDGET_TOASTER_ID,
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSubmitButtonClick = async () => {
    if (!isWalletConnected) {
      await showModal(<WalletConnectDialog />);
      return;
    }

    if (!selectedRoute?.route || !inputAsset || !outputAsset) return;

    const { confirmed } = await showModal(<SwapConfirmDialog swapRoute={selectedRoute} />);

    if (!confirmed) return;

    try {
      await performSwap(selectedRoute?.route);
    } catch (error) {
      console.error("Failed to prepare swap:", error);
      toast.error(`Failed to prepare swap: ${error instanceof Error ? error.message : "Unknown error"}`, {
        toasterId: SWAPKIT_WIDGET_TOASTER_ID,
      });
    }
  };

  const submitButtonContent = match({ amount, inputAsset, isSwapping, isWalletConnected, outputAsset })
    .with({ isSwapping: true }, () => (
      <>
        <Loader2Icon className="sk-ui-mr-2 sk-ui-h-4 sk-ui-w-4 sk-ui-animate-spin" />
        Swapping...
      </>
    ))
    .with({ isWalletConnected: false }, () => "Connect wallet")
    .with({ inputAsset: P.nullish }, { outputAsset: P.nullish }, () => "Select Assets")
    .with({ amount: P.nullish }, () => "Enter Amount")
    .otherwise(() => "Swap");

  const isSubmitButtonDisabled =
    (isWalletConnected && !(inputAsset && outputAsset && Number.parseFloat(amount ?? "0") > 0)) ||
    isSwapping ||
    isFetchingQuote;

  return (
    <div className="sk-ui-flex sk-ui-flex-col sk-ui-gap-4">
      <h1 className="sk-ui-font-medium sk-ui-text-2xl">Swap</h1>

      <Card>
        <CardContent className="sk-ui-grid sk-ui-gap-6">
          <div className="sk-ui-space-y-4">
            <div className="sk-ui-grid sk-ui-gap-4">
              <SwapInputWithChainSelector
                amount={amount}
                formattedAmountUSD={selectedRoute?.formattedInputAssetPriceUSD}
                isSwapping={isSwapping}
                label="Pay"
                selectedAsset={inputAsset?.toString()}
                setAmount={setAmount}
                setSelectedAsset={setInputAsset}
              />

              <div className="sk-ui--my-4 sk-ui-flex sk-ui-items-center sk-ui-space-x-4">
                <span className="sk-ui-h-px sk-ui-w-full sk-ui-bg-border" />

                <Button
                  className="sk-ui-size-10 sk-ui-shrink-0 sk-ui-rounded-full"
                  onClick={() => {
                    setInputAsset(outputAsset);
                    setOutputAsset(inputAsset);
                    setAmount(selectedRoute?.expectedBuyAmount?.toString() ?? "");
                    reset();
                  }}
                  size="unstyled"
                  variant="tertiary">
                  <ArrowDownUpIcon className="sk-ui-size-6" />
                </Button>

                <span className="sk-ui-h-px sk-ui-w-full sk-ui-bg-border" />
              </div>

              <SwapInputWithChainSelector
                amount={selectedRoute?.expectedBuyAmount?.toString() ?? ""}
                formattedAmountUSD={selectedRoute?.formattedOutputAssetPriceUSD ?? "$0.00"}
                isLoading={isFetchingQuote}
                isSwapping={isSwapping}
                label="Receive"
                selectedAsset={outputAsset?.toString()}
                setSelectedAsset={setOutputAsset}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="sk-ui-w-full"
        disabled={isSubmitButtonDisabled}
        onClick={handleSubmitButtonClick}
        size="xl"
        variant="primary">
        {submitButtonContent}
      </Button>

      {selectedRoute?.route && (
        <SwapQuotePreview
          className="!mt-6"
          routes={routes}
          selectedRoute={selectedRoute}
          setSelectedRouteIndex={setSelectedRouteIndex}
        />
      )}

      <Toaster position="bottom-right" />
      <ModalSpawner />
    </div>
  );
}
