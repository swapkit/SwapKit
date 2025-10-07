"use client";

import { AssetValue } from "@swapkit/sdk";

export function SwapAssetItem({ asset }: { asset: string | undefined }) {
  if (!asset) return;

  const assetValue = AssetValue.from({ asset });

  return (
    <div className="flex items-center gap-3">
      {/* // TODO: OR Turn both into <AssetIcon asset={assetValue} /> - automatically hides small icon when type is Native*/}
      <div className="relative">
        {/* // TODO: use TokenIcon/AssetIcon/TickerIcon? */}
        <img
          alt={assetValue?.ticker}
          className="size-10 overflow-hidden rounded-full"
          height={24}
          src={`https://storage.googleapis.com/token-list-swapkit-dev/images/${assetValue?.chain?.toLowerCase()}.${assetValue?.symbol?.toLowerCase()}.png`}
          width={24}
        />

        {assetValue?.type !== "Native" && (
          // TODO: use NetworkIcon/ChainIcon?
          <img
            alt={assetValue?.chain}
            className="-bottom-0.5 absolute right-0 size-4 rounded-full border-2 border-secondary bg-secondary"
            height={24}
            src={`https://storage.googleapis.com/token-list-swapkit-dev/images/${assetValue?.chain?.toLowerCase()}.${assetValue?.chainId?.toLowerCase()}.png`}
            width={24}
          />
        )}
      </div>

      <div className="flex flex-col items-start">
        <span className="font-medium text-base text-foreground">{assetValue?.ticker}</span>

        <span className="-mt-0.5 text-muted-foreground text-sm">{assetValue?.chain}</span>
      </div>
    </div>
  );
}
