"use client";

import { AllChains, type Chain } from "@swapkit/sdk";
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
  const totalNetworksAmount = AllChains.length;
  const visibleNetworksAmount = isNetworkListExpanded ? totalNetworksAmount : collapsedNetworksAmount;
  const canShowMore = collapsedNetworksAmount < totalNetworksAmount - 2;

  const networksToRender = useMemo(() => {
    return AllChains?.sort((a, b) => a?.localeCompare(b))?.slice(
      0,
      canShowMore ? visibleNetworksAmount : visibleNetworksAmount + 2,
    );
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
        className="sk-ui--ml-2 sk-ui-mt-1 sk-ui-w-auto sk-ui-min-w-48 sk-ui-max-w-1/2 sk-ui-rounded-lg sk-ui-px-2 sk-ui-transition-colors sk-ui-duration-100 hover:sk-ui-bg-white/[0.08]"
        onClick={handleDialogTriggerClick}>
        <SwapAssetItem asset={selectedAsset} />
      </DialogTrigger>

      <DialogContent className="sk-ui-flex sk-ui-flex-col">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        <div className="sk-ui-relative">
          <Input
            className="sk-ui-h-10 sk-ui-bg-secondary sk-ui-pl-9 placeholer:sk-ui-text-muted-foreground sk-ui-text-base sk-ui-text-foreground"
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            placeholder="Search token name"
            value={filters?.searchQuery ?? ""}
          />

          <SearchIcon className="sk-ui--translate-y-1/2 sk-ui-absolute sk-ui-top-1/2 sk-ui-left-3 sk-ui-size-4 sk-ui-text-muted-foreground" />
        </div>

        <div className="sk-ui-flex sk-ui-flex-col sk-ui-gap-2">
          <span className="sk-ui-text-muted-foreground sk-ui-text-sm">
            Network:{" "}
            <span className="sk-ui-font-medium sk-ui-text-foreground">
              {selectedNetworks?.length ? selectedNetworks?.map((network) => network.toString()).join(", ") : "All"}
            </span>
          </span>

          <div className="sk-ui-grid sk-ui-grid-cols-8 sk-ui-gap-2">
            <Button
              className={cn(
                "sk-ui-h-auto sk-ui-border sk-ui-border-transparent sk-ui-aspect-[1.3/1]",
                selectedNetworks?.length === 0 && "sk-ui-border-foreground sk-ui-text-foreground",
              )}
              onClick={() => setSelectedNetworks([])}>
              All
            </Button>

            {networksToRender?.map((chain) => {
              const isSelected = selectedNetworks?.includes(chain);

              return (
                <Button
                  className={cn(
                    "sk-ui-h-auto sk-ui-border sk-ui-border-transparent sk-ui-p-0 sk-ui-aspect-[1.3/1]",
                    isSelected && "sk-ui-border-foreground sk-ui-text-foreground",
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
                  <ChainIcon chain={chain} className="sk-ui-size-5" />
                </Button>
              );
            })}

            {canShowMore && (
              <Button
                className="sk-ui-col-span-2 sk-ui-col-start-7 sk-ui-h-auto"
                onClick={() => setIsNetworkListExpanded((isNetworkListExpanded) => !isNetworkListExpanded)}>
                {isNetworkListExpanded ? "Hide" : "Show More"}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="sk-ui-mt-2 sk-ui-overflow-y-auto sk-ui-overflow-x-hidden sk-ui-max-h-[clamp(16rem,50svh,32rem)]">
          {match({ assets, isWalletConnected })
            .with({ isWalletConnected: false }, () => (
              <div className="sk-ui-flex sk-ui-h-40 sk-ui-flex-col sk-ui-items-center sk-ui-justify-center sk-ui-gap-1">
                <header className="sk-ui-font-medium">Connect your wallet</header>

                <p className="sk-ui-text-muted-foreground sk-ui-text-sm">
                  Please connect your wallet to see your assets
                </p>
              </div>
            ))
            .when(
              ({ assets }) => assets?.length <= 0,
              () => (
                <div className="sk-ui-flex sk-ui-h-40 sk-ui-flex-col sk-ui-items-center sk-ui-justify-center sk-ui-gap-1">
                  <header className="sk-ui-font-medium">No assets found</header>

                  <p className="sk-ui-text-muted-foreground sk-ui-text-sm">
                    Try changing the selected networks or the search query
                  </p>
                </div>
              ),
            )
            .otherwise(() => (
              <div className="sk-ui-flex sk-ui-w-auto sk-ui-flex-1 sk-ui-flex-col">
                {assets?.slice(0, 100)?.map((asset) => {
                  const assetIdentifier = asset.toString();

                  return (
                    <Button
                      className="sk-ui--mx-4 sk-ui-h-auto sk-ui-w-auto sk-ui-justify-between sk-ui-rounded-lg sk-ui-px-4 sk-ui-py-2"
                      key={`swap-asset-item-${assetIdentifier}-${asset.chainId}`}
                      onClick={() => {
                        setSelectedAsset(assetIdentifier);
                        setOpen(false);
                      }}
                      variant="ghost">
                      <SwapAssetItem asset={assetIdentifier} />

                      <div
                        className={cn(
                          "sk-ui-flex sk-ui-flex-col sk-ui-items-end",
                          asset?.getValue("number") <= 0 && "sk-ui-opacity-50",
                        )}>
                        <span className="sk-ui-font-medium sk-ui-text-base sk-ui-text-foreground">
                          {asset?.getValue("number")?.toFixed(6) || "0.00"}
                        </span>

                        <span className="sk-ui--mt-0.5 sk-ui-text-muted-foreground sk-ui-text-sm">
                          {/* TODO: show the correct USD balance value */}
                          {formatCurrency(asset?.getValue("number") || 0)}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
