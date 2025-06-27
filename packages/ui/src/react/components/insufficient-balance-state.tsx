import type { AssetValue } from "@swapkit/helpers";
import { memo, useMemo } from "react";

type InsufficientBalanceStateProps = {
  asset?: AssetValue;
  required: string;
  available: string;
  onDismiss?: () => void;
  onAddFunds?: () => void;
  onReduceAmount?: () => void;
  onSwitchToken?: () => void;
  suggestedAmount?: string;
  className?: string;
  showSuggestions?: boolean;
};

type SuggestionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

const SuggestionCard = memo(
  ({ icon, title, description, action, onClick, variant = "secondary" }: SuggestionCardProps) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
        variant === "primary"
          ? "border-primary-default bg-primary-surface hover:bg-primary-hover hover:border-primary-hover"
          : "border-border-secondary bg-background-surface hover:border-border-hover hover:bg-background-hover"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            variant === "primary"
              ? "bg-primary-default text-white"
              : "bg-background-secondary text-text-secondary"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium mb-1 ${
              variant === "primary" ? "text-primary-default" : "text-text-primary"
            }`}
          >
            {title}
          </h4>
          <p className="text-sm text-text-secondary mb-2 leading-relaxed">{description}</p>
          <span
            className={`text-sm font-medium ${
              variant === "primary" ? "text-primary-default" : "text-accent-primary"
            } group-hover:underline`}
          >
            {action} →
          </span>
        </div>
      </div>
    </button>
  ),
);

SuggestionCard.displayName = "SuggestionCard";

const formatBalance = (amount: string): string => {
  const num = Number(amount);
  if (num === 0) return "0";
  if (num < 0.001) return "< 0.001";
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
  return `${(num / 1000000).toFixed(2)}M`;
};

const calculateDeficit = (required: string, available: string): string => {
  const deficit = Number(required) - Number(available);
  return Math.max(deficit, 0).toString();
};

const RECOMMENDED_BALANCE_RATIO = 0.95;

const getRecommendedAmount = (available: string): string => {
  const availableNum = Number(available);
  return (availableNum * RECOMMENDED_BALANCE_RATIO).toString();
};

export const InsufficientBalanceState = memo(
  ({
    asset,
    required,
    available,
    onDismiss,
    onAddFunds,
    onReduceAmount,
    onSwitchToken,
    suggestedAmount,
    className = "",
    showSuggestions = true,
  }: InsufficientBalanceStateProps) => {
    const symbol = useMemo(() => asset?.symbol || "TOKEN", [asset?.symbol]);
    const deficit = useMemo(() => calculateDeficit(required, available), [required, available]);
    const recommendedAmount = useMemo(
      () => suggestedAmount || getRecommendedAmount(available),
      [suggestedAmount, available],
    );
    const hasBalance = useMemo(() => Number(available) > 0, [available]);

    return (
      <div className={`bg-error-surface border border-error-default rounded-xl p-6 ${className}`}>
        <div className="text-center mb-6">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-error-default/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-error-default"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="Insufficient balance"
            >
              <title>Insufficient balance</title>
              <path
                d="M19 7H5C4.44772 7 4 7.44772 4 8V16C4 16.5523 4.44772 17 5 17H19C19.5523 17 20 16.5523 20 16V8C20 7.44772 19.5523 7 19 7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 11C13.1046 11 14 10.1046 14 9C14 7.89543 13.1046 7 12 7C10.8954 7 10 7.89543 10 9C10 10.1046 10.8954 11 12 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 21V17M16 21V17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 13V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 15L9 9M9 15L15 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-error-default mb-2">
            Insufficient {symbol} balance
          </h3>

          <p className="text-text-secondary mb-4">
            {hasBalance
              ? `You need ${formatBalance(deficit)} more ${symbol} to complete this swap`
              : `You don't have any ${symbol} in your wallet`}
          </p>

          {/* Balance Info */}
          <div className="bg-background-secondary rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-text-tertiary mb-1">Required</div>
                <div className="font-medium text-text-primary">
                  {formatBalance(required)} {symbol}
                </div>
              </div>
              <div>
                <div className="text-text-tertiary mb-1">Available</div>
                <div className="font-medium text-text-primary">
                  {formatBalance(available)} {symbol}
                </div>
              </div>
            </div>

            {hasBalance && Number(deficit) > 0 && (
              <div className="mt-3 pt-3 border-t border-border-secondary">
                <div className="text-text-tertiary mb-1 text-xs">Shortage</div>
                <div className="font-medium text-error-default">
                  {formatBalance(deficit)} {symbol}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-text-primary mb-3">
              What would you like to do?
            </h4>

            {hasBalance && onReduceAmount && Number(recommendedAmount) > 0 && (
              <SuggestionCard
                variant="primary"
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                }
                title="Reduce amount"
                description={`Use ${formatBalance(recommendedAmount)} ${symbol} instead (95% of your balance)`}
                action="Adjust amount"
                onClick={onReduceAmount}
              />
            )}

            {onAddFunds && (
              <SuggestionCard
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                title="Add funds"
                description={`Deposit more ${symbol} to your wallet from an exchange or another wallet`}
                action="Add funds"
                onClick={onAddFunds}
              />
            )}

            {onSwitchToken && (
              <SuggestionCard
                icon={
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                title="Switch token"
                description="Choose a different token that you have enough balance for"
                action="Browse tokens"
                onClick={onSwitchToken}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-2.5 px-4 bg-background-secondary hover:bg-background-hover text-text-primary font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}

          {hasBalance && onReduceAmount && (
            <button
              type="button"
              onClick={onReduceAmount}
              className="flex-1 py-2.5 px-4 bg-primary-default hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
            >
              Use {formatBalance(recommendedAmount)} {symbol}
            </button>
          )}

          {!hasBalance && onAddFunds && (
            <button
              type="button"
              onClick={onAddFunds}
              className="flex-1 py-2.5 px-4 bg-primary-default hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
            >
              Add {symbol}
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-background-secondary rounded-lg">
          <div className="flex gap-2">
            <svg
              className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="none"
              aria-label="Information"
            >
              <title>Information</title>
              <path
                d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 14V10M10 6H10.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-xs text-text-secondary">
              <p className="font-medium mb-1">Keep some {symbol} for gas fees</p>
              <p>
                Remember to keep a small amount of {symbol} in your wallet to pay for transaction
                fees, even when swapping to other tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InsufficientBalanceState.displayName = "InsufficientBalanceState";

// Simplified version for inline use
export const InlineInsufficientBalance = memo(
  ({
    asset,
    required,
    available,
    onReduce,
  }: {
    asset?: AssetValue;
    required: string;
    available: string;
    onReduce?: () => void;
  }) => {
    const symbol = useMemo(() => asset?.symbol || "TOKEN", [asset?.symbol]);
    const deficit = useMemo(() => calculateDeficit(required, available), [required, available]);

    return (
      <div className="flex items-center gap-3 p-3 bg-error-surface border border-error-default rounded-lg">
        <svg
          className="w-5 h-5 text-error-default flex-shrink-0"
          viewBox="0 0 20 20"
          fill="none"
          aria-label="Insufficient balance"
        >
          <title>Insufficient balance</title>
          <path
            d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 6V10M10 14H10.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-error-default">Insufficient {symbol} balance</p>
          <p className="text-xs text-text-secondary">
            Need {formatBalance(deficit)} more {symbol}
          </p>
        </div>

        {onReduce && Number(available) > 0 && (
          <button
            type="button"
            onClick={onReduce}
            className="text-xs font-medium text-accent-primary hover:text-accent-hover transition-colors px-2 py-1 rounded"
          >
            Use max
          </button>
        )}
      </div>
    );
  },
);

InlineInsufficientBalance.displayName = "InlineInsufficientBalance";
