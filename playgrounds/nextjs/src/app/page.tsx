"use client";

import { AssetValue, type Chain } from "@swapkit/helpers";
import type { QuoteResponseRoute } from "@swapkit/helpers/api";
import { ProviderName, SwapKitApi } from "@swapkit/sdk";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSwapKit } from "~/lib/swapKit";

export default function SwapPage() {
  const { swapKit, isWalletConnected } = useSwapKit();
  const [inputAsset, setInputAsset] = useState<string>();
  const [outputAsset, setOutputAsset] = useState<string>();
  const [amount, setAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [_estimatedOutput, setEstimatedOutput] = useState<string>();
  const [routes, setRoutes] = useState<QuoteResponseRoute[]>([]);

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

  const updateEstimatedOutput = useCallback(async () => {
    if (!(inputAsset && outputAsset && amount && swapKit)) {
      setEstimatedOutput(undefined);
      setRoutes([]);
      return;
    }

    try {
      const sourceAddress = swapKit.getAddress(inputAsset.split(".")[0] as Chain);
      const destinationAddress = swapKit.getAddress(outputAsset.split(".")[0] as Chain);

      const quote = await SwapKitApi.getSwapQuote({
        buyAsset: outputAsset,
        destinationAddress,
        includeTx: true,
        sellAmount: amount,
        sellAsset: inputAsset,
        slippage: 3,
        sourceAddress,
      });

      if (quote?.routes?.length) {
        setRoutes(quote.routes);
        setEstimatedOutput(quote.routes[0].expectedBuyAmount);
      }
    } catch (error) {
      console.error("Failed to get quote:", error);
      toast.error(`Failed to get quote: ${error instanceof Error ? error.message : "Unknown error"}`);
      setEstimatedOutput(undefined);
      setRoutes([]);
    }
  }, [inputAsset, outputAsset, amount, swapKit]);

  useEffect(() => {
    updateEstimatedOutput();
  }, [updateEstimatedOutput]);

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
                  <ArrowDownUp className="size-6" />
                </Button>

                <span className="h-px w-full bg-border" />
              </div>

              <SwapInputWithChainSelector
                amount={amount}
                isSwapping={isSwapping}
                label="Receive"
                selectedAsset={outputAsset}
                setAmount={setOutputAsset}
                setSelectedAsset={setOutputAsset}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        disabled={!(inputAsset && outputAsset && amount) || isSwapping || !isWalletConnected}
        onClick={async () => {
          if (!(routes.length && inputAsset)) return;
          try {
            const assetValue = await AssetValue.from({ amount, asset: inputAsset, asyncTokenLookup: true });
            const amountValue = assetValue.set(amount);
            await swap(routes[0], amountValue);
          } catch (error) {
            console.error("Failed to prepare swap:", error);
            toast.error(`Failed to prepare swap: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }}
        size="lg"
        variant="primary">
        {isSwapping ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Swapping...
          </>
        ) : isWalletConnected ? (
          inputAsset && outputAsset ? (
            amount ? (
              "Swap"
            ) : (
              "Enter Amount"
            )
          ) : (
            "Select Assets"
          )
        ) : (
          "Connect wallet"
        )}
      </Button>
    </div>
  );
}

function SwapInputWithChainSelector({
  label,

  selectedAsset,
  setSelectedAsset,

  amount,
  setAmount,

  isSwapping,
}: {
  label: string;

  // TODO: move to react-hook-form
  selectedAsset: string | undefined;
  setSelectedAsset: (asset: string | undefined) => void;
  amount: string | undefined;
  setAmount: (amount: string) => void;
  isSwapping: boolean;
}) {
  const { balances } = useSwapKit();

  const { chains, balanceGroupedByChain } = useMemo(() => {
    const balanceGroupedByChain = (Array.isArray(balances) ? balances : []).reduce(
      (acc: Record<Chain, AssetValue[]>, assetValue: AssetValue) => {
        if (!acc[assetValue.chain]) {
          acc[assetValue.chain] = [];
        }

        if (assetValue.isGasAsset || assetValue.getValue("number") > 0) {
          acc[assetValue.chain].push(assetValue);
        }

        return acc;
      },
      {} as Record<Chain, AssetValue[]>,
    );

    const chains = Object.keys(balanceGroupedByChain) as Chain[];

    return { balanceGroupedByChain, chains };
  }, [balances]);

  return (
    <div className="-my-2">
      <span className="text-muted-foreground text-xs">{label}</span>

      <div className="flex justify-between">
        <Select onValueChange={setSelectedAsset} value={selectedAsset}>
          <SelectTrigger className="w-auto min-w-0">
            <SelectValue placeholder="Select input asset" />
          </SelectTrigger>

          <SelectContent>
            {chains.map((chain) => {
              if (!balanceGroupedByChain[chain]?.length) return null;

              return (
                <SelectGroup key={chain}>
                  <SelectLabel>{chain}</SelectLabel>

                  {balanceGroupedByChain[chain]?.map((assetValue: AssetValue) => (
                    <SelectItem key={assetValue.toString()} value={assetValue.toString()}>
                      <div className="flex w-full items-center justify-between">
                        <span>{assetValue.symbol}</span>

                        <span className="text-muted-foreground">{assetValue.getValue("number").toFixed(6)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>

        <div className="flex flex-col items-end gap-2">
          <Input
            className="-mr-4 !shadow-none !border-0 !ring-0 !ring-offset-0 bg-transparent text-end font-medium text-2xl"
            disabled={!selectedAsset || isSwapping}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            type="text"
            value={amount}
          />

          <span className="text-muted-foreground text-sm">$0.00</span>
        </div>
      </div>
    </div>
  );
}
