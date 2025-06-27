import { memo, useCallback, useMemo, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, ClockIcon } from "./icons";

interface ProviderInfo {
  id: string;
  name: string;
  logo?: string;
  isRecommended?: boolean;
  estimatedTime?: number;
  outputAmount: string;
  outputSymbol: string;
  fees: {
    minimumReceived: string;
    liquidityFee: string;
    exchangeFee: string;
    inboundNetworkFee: string;
  };
}

interface ProviderSectionProps {
  provider?: ProviderInfo;
  onSelectProvider: () => void;
  isLoading?: boolean;
  slippage?: number;
}

export const ProviderSection = memo(
  ({ provider, onSelectProvider, isLoading, slippage = 1 }: ProviderSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const handleChangeProvider = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectProvider();
      },
      [onSelectProvider],
    );

    const ESTIMATED_TIME_FALLBACK = 12;

    const { estimatedMinutes, estimatedSeconds } = useMemo(() => {
      if (!provider?.estimatedTime) {
        return { estimatedMinutes: 0, estimatedSeconds: ESTIMATED_TIME_FALLBACK };
      }
      return {
        estimatedMinutes: Math.floor(provider.estimatedTime / 60),
        estimatedSeconds: provider.estimatedTime % 60,
      };
    }, [provider?.estimatedTime]);

    const formattedTime = useMemo(() => {
      return `${String(estimatedMinutes).padStart(2, "0")}:${String(estimatedSeconds).padStart(2, "0")}`;
    }, [estimatedMinutes, estimatedSeconds]);

    if (isLoading) {
      return (
        <div className="bg-background-surface rounded-xl p-3 sm:p-4 mt-3 sm:mt-4">
          <div className="flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-background-hover rounded-full" />
              <div className="h-4 w-20 bg-background-hover rounded-md" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-4 w-12 bg-background-hover rounded-md" />
              <div className="h-5 w-24 bg-background-hover rounded-md" />
            </div>
          </div>
        </div>
      );
    }

    if (!provider) {
      return null;
    }

    return (
      <div className="bg-background-surface rounded-xl mt-3 sm:mt-4">
        <button
          type="button"
          onClick={toggleExpanded}
          className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-background-hover transition-colors rounded-xl touch-manipulation"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              {provider.logo ? (
                <img
                  src={provider.logo}
                  alt={provider.name}
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                />
              ) : (
                <span className="text-black font-bold text-sm">
                  {provider.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-medium text-sm sm:text-base text-text-primary">
                {provider.name}
              </span>
              {provider.isRecommended && (
                <span className="px-1.5 py-0.5 bg-accent-primary text-white text-[10px] sm:text-[11px] font-semibold rounded">
                  Best
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 text-accent-primary">
              <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">{formattedTime}</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm sm:text-base text-text-primary">
                {provider.outputAmount} {provider.outputSymbol}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-text-tertiary flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-text-tertiary flex-shrink-0" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-border-primary">
            <div className="space-y-2.5 sm:space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-text-secondary font-normal">
                  Minimum received after slippage ({slippage}%)
                </span>
                <span className="text-xs sm:text-sm font-medium text-text-primary">
                  {provider.fees.minimumReceived} {provider.outputSymbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-text-secondary font-normal">
                  Liquidity fee
                </span>
                <span className="text-xs sm:text-sm font-medium text-text-primary">
                  {provider.fees.liquidityFee}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-text-secondary font-normal">
                  Exchange fee
                </span>
                <span className="text-xs sm:text-sm font-bold text-accent-primary">FREE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-text-secondary font-normal">
                  Inbound network fee
                </span>
                <span className="text-xs sm:text-sm font-medium text-text-primary">
                  {provider.fees.inboundNetworkFee}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleChangeProvider}
              className="w-full mt-3 sm:mt-4 py-2 text-xs sm:text-sm font-semibold text-accent-primary hover:text-accent-hover transition-colors min-h-[36px] sm:min-h-[40px] touch-manipulation"
            >
              Change provider
            </button>
          </div>
        )}
      </div>
    );
  },
);

ProviderSection.displayName = "ProviderSection";
