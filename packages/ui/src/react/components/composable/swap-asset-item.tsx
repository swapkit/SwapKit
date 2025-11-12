"use client";

import { AssetValue } from "@swapkit/sdk";
import { AssetIcon } from "../asset-icon";

export function SwapAssetItem({ asset }: { asset: string | null | undefined }) {
  if (!asset) return;

  const assetValue = AssetValue.from({ asset });

  return (
    <div className="flex items-center gap-3">
      <AssetIcon asset={asset} />

      <div className="flex flex-col items-start">
        <span className="font-medium text-base text-foreground">{assetValue?.ticker}</span>

        <span className="-mt-0.5 text-muted-foreground text-sm">{assetValue?.chain}</span>
      </div>
    </div>
  );
}
