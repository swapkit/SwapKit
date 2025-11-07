"use client";

import { AssetValue } from "@swapkit/sdk";
import { AssetIcon } from "../asset-icon";

export function SwapAssetItem({ asset }: { asset: string | undefined }) {
  if (!asset) return;

  const assetValue = AssetValue.from({ asset });

  return (
    <div className="flex min-w-0 items-center gap-3">
      <AssetIcon asset={asset} />

      <div className="flex min-w-0 flex-col items-start">
        <span className="max-w-full truncate font-medium text-base text-foreground">{assetValue?.ticker}</span>

        <span className="-mt-0.5 text-muted-foreground text-sm">{assetValue?.chain}</span>
      </div>
    </div>
  );
}
