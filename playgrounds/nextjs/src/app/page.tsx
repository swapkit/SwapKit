"use client";

import { AssetValue, type Chain } from "@swapkit/helpers";
import type { QuoteResponseRoute } from "@swapkit/helpers/api";
import { ProviderName, SwapKitApi } from "@swapkit/sdk";
import { ArrowDownUp, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { useSwapKit } from "~/lib/swapKit";

export default function SwapPage() {
  const { swapKit, isWalletConnected } = useSwapKit();
  const [inputAsset, setInputAsset] = useState<string>("NEAR.USDT-usdt.tether-token.near");
  const [outputAsset, setOutputAsset] = useState<string>("THOR.RUNE");
  const [amount, setAmount] = useState("4.20");
  const [isSwapping, setIsSwapping] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState<string>();
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
        size="xl"
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
  setAmount?: (amount: string) => void;
  isSwapping: boolean;
}) {
  return (
    <div className="-my-2">
      <span className="text-muted-foreground text-xs">{label}</span>

      <div className="flex justify-between">
        <SwapAssetSelect selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} />

        <div className="flex flex-col items-end">
          <Input
            className="-mr-4 !shadow-none !border-0 !ring-0 !ring-offset-0 bg-transparent text-end font-medium text-2xl"
            disabled={!selectedAsset || isSwapping || !setAmount}
            onChange={(e) => setAmount?.(e.target.value)}
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

function SwapAssetSelect({
  selectedAsset,
  setSelectedAsset,
}: {
  selectedAsset: string | undefined;
  setSelectedAsset: (asset: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const { chains, balanceGroupedByChain } = useSwapKit();

  useEffect(() => {
    if (!selectedAsset) return;

    setOpen(false);
  }, [selectedAsset]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger className="-ml-2 mt-1 w-auto min-w-48 max-w-1/2 rounded-lg px-2 transition-colors duration-100 hover:bg-white/[0.08]">
        <SwapAssetItem asset={selectedAsset} />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>Select Token</DialogHeader>

        <Input placeholder="Search" />

        <span className="text-muted-foreground text-sm">
          Network: <span className="text-foreground">All</span>
        </span>

        <div className="grid gap-4">
          {chains.map((chain) => {
            if (!balanceGroupedByChain[chain]?.length) return null;

            return (
              <div className="flex flex-col gap-2" key={`select-asset-chain-${chain}`}>
                {balanceGroupedByChain[chain]?.map((assetValue) => (
                  <Button
                    className="-mx-2 w-auto flex-1 justify-between rounded-lg px-2 py-1"
                    key={`swap-asset-item-${assetValue.toString()}`}
                    onClick={() => setSelectedAsset?.(assetValue.toString())}
                    variant="ghost">
                    <SwapAssetItem asset={assetValue.toString()} key={`swap-asset-item-${assetValue.toString()}`} />

                    <div className="flex flex-col items-end">
                      <span className="font-medium text-base text-foreground">Label</span>

                      <span className="-mt-0.5 text-muted-foreground text-sm">Label</span>
                    </div>
                  </Button>
                ))}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SwapAssetItem({ asset }: { asset: string | undefined }) {
  if (!asset) return;

  const assetValue = AssetValue.from({ asset });

  const iconUrl = assetValue?.getIconUrl();

  if (!iconUrl) return;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Image
          alt={assetValue?.symbol}
          className="size-10 overflow-hidden rounded-full"
          height={40}
          src={iconUrl}
          width={40}
        />

        <Image
          alt={assetValue?.chainId}
          className="-bottom-0.5 absolute right-0 size-4 rounded-full border-2 border-secondary bg-secondary"
          height={16}
          src={iconUrl}
          width={16}
        />
      </div>

      <div className="flex flex-col items-start">
        <span className="font-medium text-base text-foreground">{assetValue?.ticker}</span>

        <span className="-mt-0.5 text-muted-foreground text-sm">{assetValue?.chain}</span>
      </div>
    </div>
  );
}
