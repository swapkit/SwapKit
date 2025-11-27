"use client";

import { AssetValue } from "@swapkit/sdk";
import { forwardRef } from "react";
import { cn } from "../../../lib/utils";
import { AssetIcon } from "../simple/asset-icon";

type SwapAssetItemProps = { asset: string | null | undefined; className?: string };

export const SwapAssetItem = forwardRef<HTMLDivElement, SwapAssetItemProps>(function SwapAssetItem(
  { asset, className },
  ref,
) {
  if (!asset) return null;

  const assetValue = AssetValue.from({ asset });

  return (
    <div className={cn("sk-ui-flex sk-ui-min-w-0 sk-ui-items-center sk-ui-gap-3", className)} ref={ref}>
      <AssetIcon asset={asset} />

      <div className="sk-ui-flex sk-ui-min-w-0 sk-ui-flex-col sk-ui-items-start">
        <span className="sk-ui-max-w-full sk-ui-truncate sk-ui-font-medium sk-ui-text-base sk-ui-text-foreground">
          {assetValue?.ticker}
        </span>

        <span className="sk-ui--mt-0.5 sk-ui-text-muted-foreground sk-ui-text-sm">{assetValue?.chain}</span>
      </div>
    </div>
  );
});
