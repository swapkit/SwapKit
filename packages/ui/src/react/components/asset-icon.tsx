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
    <div className={cn("sk-ui-relative sk-ui-size-10", className)}>
      <img
        alt={assetValue?.ticker}
        className={"sk-ui-size-full sk-ui-overflow-hidden sk-ui-rounded-full"}
        height={40}
        src={`${temp_host}/images/${assetValue?.chain?.toLowerCase()}.${assetValue?.symbol?.toLowerCase()}.png`}
        width={40}
      />

      {assetValue?.type !== "Native" && (
        <img
          alt={assetValue?.chain}
          className="sk-ui--bottom-0.5 sk-ui-absolute sk-ui-right-0 sk-ui-size-[45%] sk-ui-rounded-full sk-ui-border-2 sk-ui-border-secondary sk-ui-bg-secondary"
          height={24}
          src={`${temp_host}/images/${assetValue?.chain?.toLowerCase()}.${assetValue?.chainId?.toLowerCase()}.png`}
          width={24}
        />
      )}
    </div>
  );
}
