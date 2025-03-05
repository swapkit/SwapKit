import { useState } from "react";
import type { ChangeEvent } from "react";

type Asset = {
  symbol: string;
  name: string;
  chain: string;
  ticker: string;
  decimals: number;
};

type AssetInputProps = {
  value: string;
  assets: Asset[];
  selectedAsset: Asset | null;
  onValueChange: (value: string) => void;
  onAssetChange: (asset: Asset) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
};

export const AssetInput = ({
  value,
  assets,
  selectedAsset,
  onValueChange,
  onAssetChange,
  placeholder = "0.0",
  disabled = false,
  label,
}: AssetInputProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const newValue = e.target.value.replace(/[^0-9.]/g, "");
    onValueChange(newValue);
  };

  const handleAssetSelect = (asset: Asset) => {
    onAssetChange(asset);
    setIsDropdownOpen(false);
  };

  const inputId = label ? `asset-input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined;

  return (
    <div className="asset-input-container">
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className="asset-input-wrapper">
        <input
          id={inputId}
          type="text"
          value={value}
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
                <span>{asset.name}</span>
                <span>
                  {asset.symbol} ({asset.chain})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
