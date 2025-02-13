"use client";

import { AssetValue, type Chain } from "@swapkit/helpers";
import type { QuoteResponseRoute } from "@swapkit/helpers/api";
import { ProviderName, SwapKitApi } from "@swapkit/sdk";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
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
  const { balances, swapKit, isWalletConnected } = useSwapKit();
  const [inputAsset, setInputAsset] = useState<string>();
  const [outputAsset, setOutputAsset] = useState<string>();
  const [amount, setAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState<string>();
  const [routes, setRoutes] = useState<QuoteResponseRoute[]>([]);

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

    return {
      chains: Object.keys(balanceGroupedByChain) as Chain[],
      balanceGroupedByChain,
    };
  }, [balances]);

  const handleSwap = async (route: QuoteResponseRoute) => {
    if (!swapKit) return;

    try {
      setIsSwapping(true);
      const swap = await swapKit.swap({
        route,
      });

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
      const isChainFlip = route?.providers?.includes(ProviderName.CHAINFLIP);
      if (isChainFlip) {
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
      toast.error(
        `Swap process failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
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
        sellAsset: inputAsset,
        buyAsset: outputAsset,
        sellAmount: amount,
        sourceAddress,
        destinationAddress,
        slippage: 3,
        includeTx: true,
      });

      if (quote?.routes?.length) {
        setRoutes(quote.routes);
        setEstimatedOutput(quote.routes[0].expectedBuyAmount);
      }
    } catch (error) {
      console.error("Failed to get quote:", error);
      toast.error(
        `Failed to get quote: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setEstimatedOutput(undefined);
      setRoutes([]);
    }
  }, [inputAsset, outputAsset, amount, swapKit]);

  useEffect(() => {
    updateEstimatedOutput();
  }, [updateEstimatedOutput]);

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Swap</span>
          {!isWalletConnected && (
            <span className="text-sm font-normal text-muted-foreground">
              Connect wallet to start swapping
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Select value={inputAsset} onValueChange={setInputAsset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select input asset" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) =>
                    balanceGroupedByChain[chain]?.length ? (
                      <SelectGroup key={chain}>
                        <SelectLabel>{chain}</SelectLabel>
                        {balanceGroupedByChain[chain].map((assetValue: AssetValue) => (
                          <SelectItem key={assetValue.toString()} value={assetValue.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{assetValue.symbol}</span>
                              <span className="text-muted-foreground">
                                {assetValue.getValue("number").toFixed(6)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : null,
                  )}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!inputAsset || isSwapping}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background h-8 w-8"
                  onClick={() => {
                    const temp = inputAsset;
                    setInputAsset(outputAsset);
                    setOutputAsset(temp);
                  }}
                >
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Select value={outputAsset} onValueChange={setOutputAsset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select output asset" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) =>
                    balanceGroupedByChain[chain]?.length ? (
                      <SelectGroup key={chain}>
                        <SelectLabel>{chain}</SelectLabel>
                        {balanceGroupedByChain[chain].map((assetValue: AssetValue) => (
                          <SelectItem key={assetValue.toString()} value={assetValue.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{assetValue.symbol}</span>
                              <span className="text-muted-foreground">
                                {assetValue.getValue("number").toFixed(6)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : null,
                  )}
                </SelectContent>
              </Select>
              {estimatedOutput && (
                <div className="text-sm text-muted-foreground text-right">
                  Expected output: {estimatedOutput}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={!(inputAsset && outputAsset && amount) || isSwapping || !isWalletConnected}
          onClick={async () => {
            if (!(routes.length && inputAsset)) return;
            try {
              const assetValue = await AssetValue.from({
                asyncTokenLookup: true,
                asset: inputAsset,
                amount,
              });
              const amountValue = assetValue.set(amount);
              await swap(routes[0], amountValue);
            } catch (error) {
              console.error("Failed to prepare swap:", error);
              toast.error(
                `Failed to prepare swap: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
          }}
        >
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
            "Connect Wallet to Swap"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
