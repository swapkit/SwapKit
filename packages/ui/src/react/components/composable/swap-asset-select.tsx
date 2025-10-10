"use client";

import { Chain } from "@swapkit/sdk";
import { defaultLists } from "@swapkit/tokens";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useSwapKit } from "../../swapkit-context";
import { temp_host } from "../asset-icon";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { SwapAssetItem } from "./swap-asset-item";

export function SwapAssetSelect({
  selectedAsset,
  setSelectedAsset,
}: {
  selectedAsset: string | undefined;
  setSelectedAsset: (asset: string) => void;
}) {
  const [isNetworkListExpanded, setIsNetworkListExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { chains, balanceGroupedByChain } = useSwapKit();

  // 8 cols * 2 rows - 1 (button "all") - 2 (button "hide/show more")
  const collapsedNetworksAmount = 8 * 2 - 1 - 2;
  const visibleNetworksAmount = isNetworkListExpanded ? Object.values(Chain).length : collapsedNetworksAmount;
  const canShowMore = visibleNetworksAmount < Object.values(Chain).length - 2;

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
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            className="h-10 bg-secondary pl-9 placeholer:text-muted-foreground text-base text-foreground"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search token name"
            value={searchQuery}
          />

          <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">
            Network: <span className="text-foreground">All</span>
          </span>

          <div className="grid grid-cols-8 gap-2">
            <Button className="aspect-[1.3/1] h-auto">All</Button>

            {Object.values(Chain)
              .filter((chain) => chain.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, canShowMore ? visibleNetworksAmount : visibleNetworksAmount + 2)
              .map((chain) => (
                <Button className="aspect-[1.3/1] h-auto" key={`swap-asset-item-${chain}`}>
                  <img
                    alt={chain}
                    className="h-auto w-full overflow-clip rounded-full"
                    height={24}
                    src={`${temp_host}/images/${chain}.${chain}.png`}
                    width={24}
                  />
                </Button>
              ))}

            {visibleNetworksAmount < defaultLists?.length - 3 && (
              <Button
                className="col-span-2 col-start-7 h-auto"
                onClick={() => setIsNetworkListExpanded((isNetworkListExpanded) => !isNetworkListExpanded)}>
                {isNetworkListExpanded ? "Hide" : "Show More"}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="grid gap-4">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
