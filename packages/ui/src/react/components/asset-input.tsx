import { AssetValue, SKConfig } from "@swapkit/helpers";
import { type ChangeEvent, useMemo, useState } from "react";

type AssetInputProps = {
  predefinedAssets?: AssetValue[];
  selectedAsset?: AssetValue;
  onValueChange: (value: string) => void;
  onAssetChange: (asset: AssetValue) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
};

export const AssetInput = ({
  disabled = false,
  label,
  onAssetChange,
  onValueChange,
  placeholder = "0.0",
  predefinedAssets,
  selectedAsset,
}: AssetInputProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const defaultPredefinedAssets = useMemo(() => {
    const chainAssets = SKConfig.get("chains")?.map((chain) => AssetValue.from({ chain }));
    const stableAssets = [
      "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "ETH.USDT-0xdAC17F958D2ee523a2206206994597C13D831ec7",
    ].map((asset) => AssetValue.from({ asset }));

    return [...stableAssets, ...chainAssets];
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9.]/g, "");
    onValueChange(newValue);
  };

  const handleAssetSelect = (asset: AssetValue) => {
    onAssetChange(asset);
    setIsDropdownOpen(false);
  };

  const inputId = label ? `asset-input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined;

  const assets = useMemo(
    () => predefinedAssets || defaultPredefinedAssets,
    [predefinedAssets, defaultPredefinedAssets],
  );

  return (
    <div className="asset-input-container">
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className="asset-input-wrapper">
        <input
          id={inputId}
          type="text"
          value={selectedAsset?.getValue("string")}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
        />

        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled || assets.length === 0}
        >
          {selectedAsset ? (
            <span>
              {selectedAsset.symbol} ({selectedAsset.chain})
            </span>
          ) : (
            "Select Asset"
          )}
        </button>

        {isDropdownOpen && (
          <div className="asset-dropdown">
            {assets.map((asset) => (
              <button
                type="button"
                key={`${asset.chain}-${asset.symbol}`}
                className="asset-option"
                onClick={() => handleAssetSelect(asset)}
              >
                <span>
                  {asset.ticker} ({asset.chain})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
