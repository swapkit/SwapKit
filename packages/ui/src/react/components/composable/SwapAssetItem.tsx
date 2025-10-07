import { AssetValue } from "@swapkit/sdk";

export function SwapAssetItem({ asset }: { asset: string | undefined }) {
  if (!asset) return;

  const assetValue = AssetValue.from({ asset });

  const iconUrl = assetValue?.getIconUrl();

  if (!iconUrl) return;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <img
          alt={assetValue?.symbol}
          className="size-10 overflow-hidden rounded-full"
          height={40}
          src={iconUrl}
          width={40}
        />

        <img
          alt={assetValue?.chainId}
          className="-bottom-0.5 absolute right-0 size-4 rounded-full border-2 border-secondary bg-secondary"
          height={16}
          src={iconUrl}
          width={16}
        />
      </div>

      <div className="flex flex-col items-start">
        <span className="font-medium text-base text-foreground">{assetValue?.ticker}</span>

        <span className="-mt-0.5 text-muted-foreground text-sm">{assetValue?.chain}</span>
      </div>
    </div>
  );
}
