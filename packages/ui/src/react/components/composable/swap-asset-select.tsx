"use client";

import { useEffect, useState } from "react";
import { useSwapKit } from "../../swapkit-context";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { SwapAssetItem } from "./swap-asset-item";

export function SwapAssetSelect({
  selectedAsset,
  setSelectedAsset,
}: {
  selectedAsset: string | undefined;
  setSelectedAsset: (asset: string) => void;
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
          {chains?.map((chain) => {
            if (!balanceGroupedByChain?.[chain]?.length) return null;

            return (
              <div className="flex flex-col gap-2" key={`select-asset-chain-${chain}`}>
                {balanceGroupedByChain?.[chain]?.map((assetValue) => (
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
