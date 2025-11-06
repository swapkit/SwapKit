"use client";

import { Chain } from "@swapkit/sdk";
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { match } from "ts-pattern";
import { cn, formatCurrency } from "../../../lib/utils";
import { useFilteredSortedAssets } from "../../hooks/use-filtered-sorted-assets";
import { showModal } from "../../hooks/use-modal";
import { useSwapKit } from "../../swapkit-context";
import { ChainIcon } from "../chain-icon";
import { WalletConnectDialog } from "../dialogs/wallet-connect-dialog";
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
  const [selectedNetworks, setSelectedNetworks] = useState<Chain[]>([]);
  const [open, setOpen] = useState(false);
  const { isWalletConnected } = useSwapKit();

  const { assets, filters, setFilters } = useFilteredSortedAssets();

  // 8 cols * 2 rows - 1 (button "all") - 2 (button "hide/show more")
  const collapsedNetworksAmount = 8 * 2 - 1 - 2;
  const totalNetworksAmount = Object.values(Chain).length;
  const visibleNetworksAmount = isNetworkListExpanded ? totalNetworksAmount : collapsedNetworksAmount;
  const canShowMore = collapsedNetworksAmount < totalNetworksAmount - 2;

  const networksToRender = useMemo(() => {
    return Object.values(Chain)
      ?.sort((a, b) => a?.localeCompare(b))
      ?.slice(0, canShowMore ? visibleNetworksAmount : visibleNetworksAmount + 2);
  }, [canShowMore, visibleNetworksAmount]);

  const handleDialogTriggerClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWalletConnected) {
      setOpen(true);
      return;
    }

    const { confirmed } = await showModal(<WalletConnectDialog />);

    if (!confirmed) return;

    setOpen(true);
  };

  if (!selectedAsset) return null;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        className="-ml-2 mt-1 w-auto min-w-48 max-w-1/2 rounded-lg px-2 transition-colors duration-100 hover:bg-white/[0.08]"
        onClick={handleDialogTriggerClick}>
        <SwapAssetItem asset={selectedAsset} />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            className="h-10 bg-secondary pl-9 placeholer:text-muted-foreground text-base text-foreground"
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            placeholder="Search token name"
            value={filters?.searchQuery ?? ""}
          />

          <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">
            Network:{" "}
            <span className="font-medium text-foreground">
              {selectedNetworks?.length ? selectedNetworks?.map((network) => network.toString()).join(", ") : "All"}
            </span>
          </span>

          <div className="grid grid-cols-8 gap-2">
            <Button
              className={cn(
                "aspect-[1.3/1] h-auto border border-transparent",
                selectedNetworks?.length === 0 && "border-foreground text-foreground",
              )}
              onClick={() => setSelectedNetworks([])}>
              All
            </Button>

            {networksToRender?.map((chain) => {
              const isSelected = selectedNetworks?.includes(chain);
              return (
                <Button
                  className={cn(
                    "aspect-[1.3/1] h-auto border border-transparent p-0",
                    isSelected && "border-foreground text-foreground",
                  )}
                  key={`swap-asset-network-${chain}`}
                  onClick={() => {
                    setSelectedNetworks((selectedNetworks) => {
                      if (isSelected) {
                        return selectedNetworks.filter((c) => c !== chain);
                      }

                      return Array.from(new Set([...selectedNetworks, chain]));
                    });
                  }}>
                  <ChainIcon chain={chain} className="size-5" />
                </Button>
              );
            })}

            {canShowMore && (
              <Button
                className="col-span-2 col-start-7 h-auto"
                onClick={() => setIsNetworkListExpanded((isNetworkListExpanded) => !isNetworkListExpanded)}>
                {isNetworkListExpanded ? "Hide" : "Show More"}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2 flex flex-col">
          {match({ assets, isWalletConnected })
            .with({ isWalletConnected: false }, () => (
              <div className="flex h-40 flex-col items-center justify-center gap-1">
                <header className="font-medium">Connect your wallet</header>

                <p className="text-muted-foreground text-sm">Please connect your wallet to see your assets</p>
              </div>
            ))
            .when(
              ({ assets }) => assets?.length <= 0,
              () => (
                <div className="flex h-40 flex-col items-center justify-center gap-1">
                  <header className="font-medium">No assets found</header>

                  <p className="text-muted-foreground text-sm">
                    Try changing the selected networks or the search query
                  </p>
                </div>
              ),
            )
            .otherwise(() => (
              <div className="-mx-6 flex max-h-[30vh] flex-col gap-2 overflow-y-auto overflow-x-hidden px-6">
                {assets?.slice(0, 500)?.map((asset) => (
                  <Button
                    className="-mx-4 w-auto flex-1 justify-between rounded-lg px-4 py-2"
                    key={`swap-asset-item-${asset.identifier}-${asset.chainId}`}
                    onClick={() => {
                      setSelectedAsset(asset.identifier);
                      setOpen(false);
                    }}
                    variant="ghost">
                    <SwapAssetItem asset={asset.identifier} />

                    {asset.assetValue && (
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-base text-foreground">
                          {asset.assetValue.getValue("number")}
                        </span>

                        <span className="-mt-0.5 text-muted-foreground text-sm">
                          {formatCurrency(asset.assetValue.getValue("number"))}
                        </span>
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
