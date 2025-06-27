import type { AssetValue } from "@swapkit/helpers";
import { memo, useCallback, useMemo, useState } from "react";
import { ChevronRightIcon } from "./icons";
import { TokenSelectModal } from "./token-select-modal";

type AssetInputProps = {
  label: "Pay" | "Receive";
  predefinedAssets?: AssetValue[];
  selectedAsset?: AssetValue;
  onAssetChange: (asset: AssetValue) => void;
  value: string;
  onValueChange: (value: string) => void;
  usdValue?: string;
  disabled?: boolean;
  onTokenSelectOpen?: () => void;
};

export const AssetInput = memo(
  ({
    label,
    predefinedAssets = [],
    selectedAsset,
    onAssetChange,
    value,
    onValueChange,
    usdValue = "0.00",
    disabled = false,
    onTokenSelectOpen,
  }: AssetInputProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const assets = predefinedAssets;
    const inputId = useMemo(() => `asset-input-${label.toLowerCase()}`, [label]);

    const handleAssetSelect = useCallback(
      (asset: AssetValue) => {
        onAssetChange(asset);
      },
      [onAssetChange],
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        if (!/^\d*\.?\d*$/.test(newValue) && newValue !== "") {
          return;
        }

        onValueChange(newValue);
      },
      [onValueChange],
    );

    const tokenColor = useMemo(() => {
      if (!selectedAsset) return "#627EEA";
      const colors: Record<string, string> = {
        ETH: "#627EEA",
        BTC: "#F7931A",
        USDT: "#26A17B",
        USDC: "#2775CA",
        DAI: "#F5AC37",
        WETH: "#627EEA",
        MATIC: "#8247E5",
        BNB: "#F3BA2F",
        AVAX: "#E84142",
        SOL: "linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%)",
        FTM: "#1969FF",
        ATOM: "#2E3148",
        DOT: "#E6007A",
        LINK: "#2A5ADA",
      };
      return colors[selectedAsset.symbol] || "#627EEA";
    }, [selectedAsset]);

    const chainColor = useMemo(() => {
      if (!selectedAsset) return "#627EEA";
      const colors: Record<string, string> = {
        ETH: "#627EEA",
        BTC: "#F7931A",
        POLYGON: "#8247E5",
        BSC: "#F3BA2F",
        AVAX: "#E84142",
        FANTOM: "#1969FF",
        SOLANA: "#00FFA3",
      };
      return colors[selectedAsset.chain.toUpperCase()] || "#627EEA";
    }, [selectedAsset]);

    const handleOpenModal = useCallback(() => {
      setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
      setIsModalOpen(false);
    }, []);

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text-secondary">{label}</span>
          {label === "Pay" && (
            <button
              type="button"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => {
                // Max button functionality to be implemented
              }}
            >
              Max
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={disabled || assets.length === 0}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedAsset ? (
              <>
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: tokenColor,
                    }}
                  >
                    {selectedAsset.symbol === "SOL" ? (
                      <svg
                        width="24"
                        height="20"
                        viewBox="0 0 20 16"
                        fill="none"
                        aria-label="Solana logo"
                      >
                        <title>Solana logo</title>
                        <path
                          d="M3.31 11.35A1 1 0 013.97 11.07H19.31C19.74 11.07 19.95 11.61 19.64 11.92L16.69 14.87A1 1 0 0116.03 15.15H0.69C0.26 15.15 0.05 14.61 0.36 14.3L3.31 11.35Z"
                          fill="white"
                        />
                        <path
                          d="M3.31 0.29A1 1 0 013.97 0.01H19.31C19.74 0.01 19.95 0.55 19.64 0.86L16.69 3.81A1 1 0 0116.03 4.09H0.69C0.26 4.09 0.05 3.55 0.36 3.24L3.31 0.29Z"
                          fill="white"
                        />
                        <path
                          d="M16.69 5.58A1 1 0 0016.03 5.3H0.69C0.26 5.3 0.05 5.84 0.36 6.15L3.31 9.1A1 1 0 003.97 9.38H19.31C19.74 9.38 19.95 8.84 19.64 8.53L16.69 5.58Z"
                          fill="white"
                        />
                      </svg>
                    ) : (
                      <span className="text-white text-base font-semibold">
                        {selectedAsset.symbol.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background-secondary flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ background: chainColor }}
                  >
                    {selectedAsset.chain.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-base font-semibold text-text-primary">
                    {selectedAsset.ticker}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 text-text-tertiary" />
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-background-hover" />
                <div className="flex items-center gap-1">
                  <span className="text-base font-medium text-text-secondary">Select token</span>
                  <ChevronRightIcon className="w-4 h-4 text-text-tertiary" />
                </div>
              </>
            )}
          </button>

          <input
            id={inputId}
            type="text"
            value={value || ""}
            onChange={handleInputChange}
            placeholder="0"
            disabled={disabled}
            className="flex-1 bg-transparent text-right font-semibold text-[28px] leading-tight text-text-primary placeholder-text-tertiary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-text-tertiary">
            {selectedAsset && label === "Pay" && "Balance: 0.00"}
          </span>
          <span className="text-sm text-text-tertiary">≈ ${usdValue}</span>
        </div>

        <TokenSelectModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onOpen={onTokenSelectOpen}
          onSelect={handleAssetSelect}
          assets={assets}
          selectedAsset={selectedAsset}
        />
      </div>
    );
  },
);

AssetInput.displayName = "AssetInput";
