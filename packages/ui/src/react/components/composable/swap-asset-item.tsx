"use client";

import { AssetValue } from "@swapkit/sdk";
import { AssetIcon } from "../asset-icon";

export function SwapAssetItem({ asset }: { asset: string | null | undefined }) {
  if (!asset) return;

  const assetValue = AssetValue.from({ asset });

  return (
    <div className="sk-ui-flex sk-ui-min-w-0 sk-ui-items-center sk-ui-gap-3">
      <AssetIcon asset={asset} />

      <div className="sk-ui-flex sk-ui-min-w-0 sk-ui-flex-col sk-ui-items-start">
        <span className="sk-ui-max-w-full sk-ui-truncate sk-ui-font-medium sk-ui-text-base sk-ui-text-foreground">{assetValue?.ticker}</span>

        <span className="sk-ui--mt-0.5 sk-ui-text-muted-foreground sk-ui-text-sm">{assetValue?.chain}</span>
      </div>
    </div>
  );
}
