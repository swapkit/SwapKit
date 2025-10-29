"use client";

import { AssetValue, ProviderName, type QuoteResponseRoute, useSwapKitStore } from "@swapkit/sdk";
import { ArrowDownUpIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { getStableConfigMemoKey } from "../utils";
import { SwapInputWithChainSelector } from "./components/composable/swap-input-chain-selector";
import { WalletConnectDialog } from "./components/dialogs/wallet-connect-dialog";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { SWAPKIT_WIDGET_TOASTER_ID, Toaster, toast } from "./components/ui/sonner";
import { ModalSpawner, showModal } from "./hooks/use-modal";
import { useSwapQuote } from "./hooks/use-swap-quote";
import { useSwapKit } from "./swapkit-context";
import type { SwapKitWidgetProps } from "./types";
import "@swapkit/ui/swapkit.css";
import { SwapQuotePreview } from "./components/composable/swap-quote-preview";

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

  const handleSwap = async (route: QuoteResponseRoute) => {
    if (!swapKit) return;

    try {
      setIsSwapping(true);
      const swap = await swapKit.swap({ route });

      await swap.wait();
      setAmount("");
      toast.success("Swap completed successfully", { toasterId: SWAPKIT_WIDGET_TOASTER_ID });
    } catch (error) {
      console.error("Swap failed:", error);
      toast.error(`Swap failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
        toasterId: SWAPKIT_WIDGET_TOASTER_ID,
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const performSwap = async (route: QuoteResponseRoute, inputAssetValue?: AssetValue) => {
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
        toast.success("Asset approved, you can now swap", { toasterId: SWAPKIT_WIDGET_TOASTER_ID });
      }
    } catch (error) {
      console.error("Swap process failed:", error);
      toast.error(`Swap process failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
        toasterId: SWAPKIT_WIDGET_TOASTER_ID,
      });
    }
  };

  const handleSubmitButtonClick = async () => {
    if (!isWalletConnected) {
      void showModal(<WalletConnectDialog />);
      return;
    }

    if (!selectedRoute?.route || !inputAsset || !outputAsset) return;

    try {
      const inputAssetValue = await AssetValue.from({ amount, asset: inputAsset?.toString(), asyncTokenLookup: true });
      const amountValue = inputAssetValue.set(amount);

      await performSwap(selectedRoute?.route, amountValue);
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
                formattedAmountUSD={selectedRoute?.formattedInputAssetPriceUSD}
                isSwapping={isSwapping}
                label="Pay"
                selectedAsset={inputAsset?.toString()}
                setAmount={setAmount}
                setSelectedAsset={setInputAsset}
              />

              <div className="-my-4 flex items-center space-x-4">
                <span className="h-px w-full bg-border" />

                <Button
                  className="size-10 shrink-0 rounded-full"
                  onClick={() => {
                    setInputAsset(outputAsset);
                    setOutputAsset(inputAsset);
                    setAmount(selectedRoute?.expectedBuyAmount?.toString() ?? "");
                    reset();
                  }}
                  size="unstyled"
                  variant="tertiary">
                  <ArrowDownUpIcon className="size-6" />
                </Button>

                <span className="h-px w-full bg-border" />
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
        className="w-full"
        disabled={
          (isWalletConnected && !(inputAsset && outputAsset && Number.parseFloat(amount ?? "0") > 0)) ||
          isSwapping ||
          isFetchingQuote
        }
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
