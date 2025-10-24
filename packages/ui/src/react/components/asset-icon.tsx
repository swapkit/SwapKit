"use client";

import { AssetValue } from "@swapkit/helpers";
import { cn } from "../../lib/utils";

interface AssetIconProps {
  asset: string;
  className?: string;
  showSmallIcon?: boolean;
}

export const temp_host =
  process.env.NODE_ENV === "development"
    ? "https://storage.googleapis.com/token-list-swapkit-dev"
    : "https://storage.googleapis.com/token-list-swapkit";

export function AssetIcon({ asset, className }: AssetIconProps) {
  if (!asset) return null;

  const assetValue = AssetValue.from({ asset });

  return (
    <div className={cn("relative size-10", className)}>
      <img
        alt={assetValue?.ticker}
        className={"size-full overflow-hidden rounded-full"}
        height={40}
        src={`${temp_host}/images/${assetValue?.chain?.toLowerCase()}.${assetValue?.symbol?.toLowerCase()}.png`}
        width={40}
      />

      {assetValue?.type !== "Native" && (
        <img
          alt={assetValue?.chain}
          className="-bottom-0.5 absolute right-0 size-[45%] rounded-full border-2 border-secondary bg-secondary"
          height={24}
          src={`${temp_host}/images/${assetValue?.chain?.toLowerCase()}.${assetValue?.chainId?.toLowerCase()}.png`}
          width={24}
        />
      )}
    </div>
  );
}
