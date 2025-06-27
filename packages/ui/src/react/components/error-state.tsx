import { memo } from "react";
import type { ValidationErrorCode } from "../types/swap.types";

type ErrorStateProps = {
  type?: "network" | "validation" | "transaction" | "quote" | "wallet" | "general";
  code?: ValidationErrorCode | string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
  className?: string;
  showIcon?: boolean;
};

const ErrorIcon = memo(({ type }: { type: string }) => {
  const baseClasses = "w-12 h-12 mx-auto mb-4";

  switch (type) {
    case "network":
      return (
        <div className={`${baseClasses} text-error-default`}>
          <svg viewBox="0 0 24 24" fill="none" aria-label="Network error">
            <title>Network error</title>
            <path
              d="M3 9L12 2L21 9V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 22V12H15V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 8V8.01M8 8L16 16M16 8L8 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case "wallet":
      return (
        <div className={`${baseClasses} text-warning-default`}>
          <svg viewBox="0 0 24 24" fill="none" aria-label="Wallet error">
            <title>Wallet error</title>
            <path
              d="M19 7H22V17H19C17.8954 17 17 16.1046 17 15V9C17 7.89543 17.8954 7 19 7Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 7H6C4.89543 7 4 7.89543 4 9V15C4 16.1046 4.89543 17 6 17H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 11V13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 4L8 8M12 4L16 8M12 4V12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case "validation":
      return (
        <div className={`${baseClasses} text-warning-default`}>
          <svg viewBox="0 0 24 24" fill="none" aria-label="Validation error">
            <title>Validation error</title>
            <path
              d="M12 2L2 22H22L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 9V13M12 17H12.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case "transaction":
      return (
        <div className={`${baseClasses} text-error-default`}>
          <svg viewBox="0 0 24 24" fill="none" aria-label="Transaction error">
            <title>Transaction error</title>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 9L9 15M9 9L15 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case "quote":
      return (
        <div className={`${baseClasses} text-error-default`}>
          <svg viewBox="0 0 24 24" fill="none" aria-label="Quote error">
            <title>Quote error</title>
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 6L20 8L18 10M6 14L4 16L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    default:
      return (
        <div className={`${baseClasses} text-error-default`}>
          <svg viewBox="0 0 24 24" fill="none" aria-label="Error">
            <title>Error</title>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 8V12M12 16H12.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
  }
});

ErrorIcon.displayName = "ErrorIcon";

const getErrorContent = (type: string, code?: string, message?: string) => {
  // Handle specific validation errors
  if (type === "validation" && code) {
    switch (code) {
      case "INSUFFICIENT_BALANCE":
        return {
          title: "Insufficient balance",
          description: "You don't have enough tokens to complete this swap",
          suggestion: "Try reducing the amount or add more funds to your wallet",
        };
      case "INVALID_AMOUNT":
        return {
          title: "Invalid amount",
          description: "Please enter a valid amount",
          suggestion: "Amount must be greater than 0",
        };
      case "NO_ROUTE":
        return {
          title: "No route found",
          description: "Unable to find a swap route for these tokens",
          suggestion: "Try different tokens or check if they're supported",
        };
      case "BELOW_MINIMUM":
        return {
          title: "Amount too small",
          description: "The swap amount is below the minimum required",
          suggestion: "Increase the amount and try again",
        };
      case "ABOVE_MAXIMUM":
        return {
          title: "Amount too large",
          description: "The swap amount exceeds the maximum allowed",
          suggestion: "Reduce the amount and try again",
        };
      case "INVALID_RECIPIENT":
        return {
          title: "Invalid recipient address",
          description: "The recipient address is not valid",
          suggestion: "Please check the address and try again",
        };
      case "SAME_TOKEN":
        return {
          title: "Same token selected",
          description: "You cannot swap a token for itself",
          suggestion: "Please select different input and output tokens",
        };
      case "NETWORK_MISMATCH":
        return {
          title: "Network mismatch",
          description: "Your wallet is connected to the wrong network",
          suggestion: "Switch your wallet to the correct network",
        };
      default:
        return {
          title: "Validation error",
          description: message || "There was an issue with your input",
          suggestion: "Please check your inputs and try again",
        };
    }
  }

  // Handle other error types
  switch (type) {
    case "network":
      return {
        title: "Network error",
        description: message || "Unable to connect to the network",
        suggestion: "Check your internet connection and try again",
      };

    case "wallet":
      return {
        title: "Wallet error",
        description: message || "There was an issue with your wallet connection",
        suggestion: "Try reconnecting your wallet or refresh the page",
      };

    case "transaction":
      return {
        title: "Transaction failed",
        description: message || "Your transaction could not be completed",
        suggestion: "Check the error details and try again with adjusted settings",
      };

    case "quote":
      return {
        title: "Unable to get quote",
        description: message || "Failed to fetch swap quotes",
        suggestion: "Check your token selection and try again",
      };

    default:
      return {
        title: "Something went wrong",
        description: message || "An unexpected error occurred",
        suggestion: "Please try again or contact support if the issue persists",
      };
  }
};

export const ErrorState = memo(
  ({
    type = "general",
    code,
    message,
    details,
    onRetry,
    onDismiss,
    retryText = "Try again",
    className = "",
    showIcon = true,
  }: ErrorStateProps) => {
    const errorContent = getErrorContent(type, code, message);

    return (
      <div className={`text-center py-8 px-4 ${className}`}>
        {showIcon && <ErrorIcon type={type} />}

        <h3 className="text-lg font-medium text-text-primary mb-2">{errorContent.title}</h3>

        <p className="text-text-secondary mb-3">{errorContent.description}</p>

        <p className="text-sm text-text-tertiary mb-6">{errorContent.suggestion}</p>

        {details && (
          <div className="bg-error-surface border border-error-default rounded-lg p-3 mb-6 text-left max-w-md mx-auto">
            <h4 className="text-sm font-medium text-error-default mb-2">Error Details</h4>
            {code && (
              <p className="text-xs text-error-default mb-1">
                <span className="font-medium">Code:</span> {code}
              </p>
            )}
            <p className="text-xs text-error-default break-words">
              <span className="font-medium">Details:</span> {details}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full bg-primary-default hover:bg-primary-hover text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              {retryText}
            </button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-full text-text-secondary hover:text-text-primary font-medium py-2 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  },
);

ErrorState.displayName = "ErrorState";

// Specific error components for common scenarios
export const NetworkError = memo(({ onRetry }: { onRetry?: () => void }) => (
  <ErrorState type="network" onRetry={onRetry} retryText="Retry connection" />
));

NetworkError.displayName = "NetworkError";

export const WalletError = memo(
  ({
    message,
    onRetry,
  }: {
    message?: string;
    onRetry?: () => void;
  }) => (
    <ErrorState type="wallet" message={message} onRetry={onRetry} retryText="Reconnect wallet" />
  ),
);

WalletError.displayName = "WalletError";

export const TransactionError = memo(
  ({
    message,
    details,
    onRetry,
  }: {
    message?: string;
    details?: string;
    onRetry?: () => void;
  }) => (
    <ErrorState
      type="transaction"
      message={message}
      details={details}
      onRetry={onRetry}
      retryText="Try again"
    />
  ),
);

TransactionError.displayName = "TransactionError";

export const QuoteError = memo(({ onRetry }: { onRetry?: () => void }) => (
  <ErrorState type="quote" onRetry={onRetry} retryText="Refresh quote" />
));

QuoteError.displayName = "QuoteError";

export const InsufficientBalanceError = memo(
  ({
    onDismiss,
  }: {
    onDismiss?: () => void;
  }) => (
    <ErrorState
      type="validation"
      code="INSUFFICIENT_BALANCE"
      onDismiss={onDismiss}
      showIcon={false}
      className="py-4"
    />
  ),
);

InsufficientBalanceError.displayName = "InsufficientBalanceError";

// Inline error component for smaller spaces
export const InlineError = memo(
  ({
    message,
    onDismiss,
  }: {
    message: string;
    onDismiss?: () => void;
  }) => (
    <div className="flex items-center gap-2 p-3 bg-error-surface border border-error-default rounded-lg">
      <svg
        className="w-5 h-5 text-error-default flex-shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        aria-label="Error"
      >
        <title>Error</title>
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
      <span className="text-sm text-error-default flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-error-default hover:text-error-hover transition-colors p-1"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  ),
);

InlineError.displayName = "InlineError";
