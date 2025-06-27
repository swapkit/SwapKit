import type { AssetValue } from "@swapkit/core";
import { useEffect, useRef } from "react";
import type { SwapQuote } from "../types/swap.types";
import { CloseIcon } from "./icons";

type ConfirmSwapModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  inputAsset?: AssetValue;
  outputAsset?: AssetValue;
  quote?: SwapQuote;
  isConfirming?: boolean;
};

export const ConfirmSwapModal = ({
  isOpen,
  onClose,
  onConfirm,
  inputAsset,
  outputAsset,
  quote,
  isConfirming = false,
}: ConfirmSwapModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConfirming) onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, isConfirming]);

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isConfirming) {
      onClose();
    }
  };

  if (!(isOpen && inputAsset && outputAsset && quote)) return null;

  const inputAmount =
    inputAsset && typeof inputAsset.getValue === "function" ? inputAsset.getValue("string") : "0";
  const outputAmount = quote.outputAmount || "0";
  const priceImpact = quote.priceImpact;
  const estimatedTime = Math.round(quote.estimatedTime / 60);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={handleModalClick}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !isConfirming) {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        className="bg-[#141514] rounded-t-3xl sm:rounded-2xl shadow-modal w-full sm:w-[360px] h-[640px] flex flex-col overflow-hidden animate-slideUp"
      >
        <div className="relative px-4 pt-6 pb-4">
          <h2 className="text-[20px] font-medium text-white leading-6">Confirm swap</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2 -m-2 w-10 h-10 flex items-center justify-center"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="bg-[#1C1C1C] rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-base">
                    {inputAsset.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">You pay</div>
                  <div className="text-xl font-medium text-white">{inputAmount}</div>
                  <div className="text-sm text-text-secondary mt-1">{inputAsset.symbol}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center my-3">
            <div className="w-8 h-8 bg-[#1C1C1C] rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-text-secondary"
                viewBox="0 0 20 20"
                fill="none"
                aria-label="Swap arrow down"
              >
                <title>Swap arrow down</title>
                <path
                  d="M10 3V17M10 17L4 11M10 17L16 11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="bg-[#1C1C1C] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-base">
                    {outputAsset.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">You receive</div>
                  <div className="text-xl font-medium text-white">{outputAmount}</div>
                  <div className="text-sm text-text-secondary mt-1">{outputAsset.symbol}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1C1C1C] rounded-xl p-4 space-y-3 mb-6">
            <h3 className="text-sm font-medium text-white mb-3">Transaction details</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Provider</span>
              <span className="text-sm font-medium text-white">{quote.provider}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Rate</span>
              <span className="text-sm font-medium text-white">
                1 {inputAsset.symbol} ≈ {(Number(outputAmount) / Number(inputAmount)).toFixed(6)}{" "}
                {outputAsset.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#252525]">
              <span className="text-sm text-text-secondary">Network fee</span>
              <span className="text-sm font-medium text-white">${quote.fees.networkUSD}</span>
            </div>
            {quote.fees.protocolUSD !== "0" && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Protocol fee</span>
                <span className="text-sm font-medium text-white">${quote.fees.protocolUSD}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Total fee</span>
              <span className="text-sm font-medium text-white">
                ${(Number(quote.fees.networkUSD) + Number(quote.fees.protocolUSD)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#252525]">
              <span className="text-sm text-text-secondary">Price impact</span>
              <span
                className={`text-sm font-medium ${
                  priceImpact > 5
                    ? "text-error-default"
                    : priceImpact > 1
                      ? "text-warning-default"
                      : "text-success-default"
                }`}
              >
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Minimum received</span>
              <span className="text-sm font-medium text-white">
                {quote.minimumReceived} {outputAsset.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Estimated time</span>
              <span className="text-sm font-medium text-white">~{estimatedTime} min</span>
            </div>
          </div>

          {priceImpact > 5 && (
            <div className="bg-error-default/10 border border-error-default/30 rounded-xl p-3 mb-6">
              <div className="flex gap-3">
                <svg
                  className="w-4 h-4 text-error-default flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-label="High price impact warning"
                >
                  <title>High price impact warning</title>
                  <path
                    d="M10 2L2 18H18L10 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 8V12M10 16H10.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-error-default">
                  <p className="font-medium mb-1">High price impact</p>
                  <p className="text-xs">
                    This trade has a price impact of {priceImpact.toFixed(2)}%. Please review
                    carefully.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full bg-white hover:bg-white/90 disabled:bg-[#1C1C1C] disabled:text-text-tertiary text-black font-medium py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px] touch-manipulation"
          >
            {isConfirming ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-label="Loading spinner"
                >
                  <title>Loading spinner</title>
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Confirming...</span>
              </>
            ) : (
              <span className="font-semibold">Confirm swap</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
