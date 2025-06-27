import { useEffect, useRef, useState } from "react";
import type { SwapQuote } from "../types/swap.types";
import { CloseIcon } from "./icons";
import { ProviderListLoading } from "./loading-state";

type Provider = {
  id: string;
  name: string;
  logo?: string;
  quote?: SwapQuote;
  isRecommended?: boolean;
  estimatedTime?: number;
  gasEstimate?: string;
  description?: string;
};

type ProviderSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: Provider) => void;
  providers: Provider[];
  selectedProviderId?: string;
  inputSymbol?: string;
  outputSymbol?: string;
};

const ProviderCard = ({
  provider,
  isSelected,
  onSelect,
  outputSymbol,
}: {
  provider: Provider;
  isSelected: boolean;
  onSelect: () => void;
  outputSymbol?: string;
}) => {
  const estimatedMinutes = provider.estimatedTime ? Math.floor(provider.estimatedTime / 60) : 0;
  const estimatedSeconds = provider.estimatedTime ? provider.estimatedTime % 60 : 12;
  const formattedTime = `${String(estimatedMinutes).padStart(2, "0")}m ${String(estimatedSeconds).padStart(2, "0")}s`;
  const outputAmount = provider.quote?.outputAmount || "0";
  const usdValue = provider.quote?.outputAmountUSD || "0.00";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-4 rounded-xl transition-all text-left touch-manipulation flex items-center justify-between ${
        isSelected
          ? "bg-background-surface border border-accent-primary"
          : "bg-background-surface border border-border-secondary hover:border-border-hover"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
          {provider.logo ? (
            <img src={provider.logo} alt={provider.name} className="w-6 h-6 object-contain" />
          ) : (
            <span className="text-black font-bold text-sm">
              {provider.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">{provider.name}</span>
            {provider.isRecommended && (
              <span className="px-1.5 py-0.5 bg-accent-primary text-white text-[10px] font-semibold rounded">
                Best
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-text-secondary text-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 4V8L10.5 9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-text-primary">
          {outputAmount} {outputSymbol}
        </div>
        <div className="text-sm text-text-secondary">≈${usdValue}</div>
      </div>
    </button>
  );
};

export const ProviderSelectModal = ({
  isOpen,
  onClose,
  onSelect,
  providers,
  selectedProviderId,
  outputSymbol = "BTC",
}: ProviderSelectModalProps) => {
  const [sortBy] = useState<"rate" | "time" | "fees">("rate");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getProviderRate = (provider: Provider) => {
    return provider.quote
      ? Number(provider.quote.outputAmount) / Number(provider.quote.inputAmount)
      : 0;
  };

  const getProviderFee = (provider: Provider) => {
    return provider.quote ? Number(provider.quote.fees.totalUSD) : 0;
  };

  const sortProviders = (a: Provider, b: Provider): number => {
    switch (sortBy) {
      case "rate":
        return getProviderRate(b) - getProviderRate(a);
      case "time":
        return (a.estimatedTime || 300) - (b.estimatedTime || 300);
      case "fees":
        return getProviderFee(a) - getProviderFee(b);
      default:
        return 0;
    }
  };

  const sortedProviders = [...providers].sort(sortProviders);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={handleModalClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        className="bg-background-secondary rounded-t-2xl sm:rounded-2xl shadow-modal w-full sm:max-w-[480px] h-auto max-h-[600px] flex flex-col animate-slideUp"
      >
        <div className="relative p-4 sm:p-6 border-b border-border-primary">
          <h2 className="text-lg sm:text-xl font-medium text-text-primary text-center">
            Select provider
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {providers.length === 0 ? (
            <ProviderListLoading />
          ) : sortedProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-text-tertiary"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-label="No providers available"
                >
                  <title>No providers available</title>
                  <path
                    d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-text-secondary text-center mb-2">No providers available</p>
              <p className="text-text-tertiary text-sm text-center">
                Try adjusting your swap parameters or try again later
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isSelected={selectedProviderId === provider.id}
                  onSelect={() => {
                    onSelect(provider);
                    onClose();
                  }}
                  outputSymbol={outputSymbol}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
