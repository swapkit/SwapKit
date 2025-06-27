import { memo, useMemo } from "react";
import { match } from "ts-pattern";
import { LoadingSpinner } from "./loading-spinner";

type LoadingStateProps = {
  type?: "tokens" | "quote" | "wallet" | "transaction" | "providers" | "general";
  message?: string;
  showSpinner?: boolean;
  className?: string;
};

type SkeletonProps = {
  className?: string;
  animate?: boolean;
};

const Skeleton = memo(({ className = "", animate = true }: SkeletonProps) => (
  <div
    className={`bg-background-hover rounded-md ${animate ? "animate-pulse" : ""} ${className}`}
  />
));

Skeleton.displayName = "Skeleton";

const TokenSkeleton = memo(() => (
  <div className="p-4 bg-background-surface rounded-xl">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
));

TokenSkeleton.displayName = "TokenSkeleton";

const QuoteSkeleton = memo(() => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-18" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
));

QuoteSkeleton.displayName = "QuoteSkeleton";

const ProviderSkeleton = memo(() => (
  <div className="p-4 border-2 border-border-secondary rounded-xl">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="w-5 h-5" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Skeleton className="h-3 w-8 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div>
        <Skeleton className="h-3 w-8 mb-1" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div>
        <Skeleton className="h-3 w-12 mb-1" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div>
        <Skeleton className="h-3 w-16 mb-1" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  </div>
));

ProviderSkeleton.displayName = "ProviderSkeleton";

const WalletSkeleton = memo(() => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: 8 }).map((_, index) => (
      <div
        key={`wallet-skeleton-${index}`}
        className="flex items-center gap-3 p-4 bg-background-surface rounded-xl"
      >
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
));

WalletSkeleton.displayName = "WalletSkeleton";

const TransactionSkeleton = memo(() => (
  <div className="text-center">
    <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
    <Skeleton className="h-6 w-48 mx-auto mb-2" />
    <Skeleton className="h-4 w-64 mx-auto mb-6" />

    <div className="bg-background-surface rounded-xl p-4 mb-6">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>

    <Skeleton className="h-12 w-full rounded-xl" />
  </div>
));

TransactionSkeleton.displayName = "TransactionSkeleton";

const renderSkeletonContent = (type: string) => {
  return match(type)
    .with("tokens", () => (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <TokenSkeleton key={`token-skeleton-${index}`} />
        ))}
      </div>
    ))
    .with("quote", () => (
      <div className="bg-background-surface rounded-xl p-4">
        <QuoteSkeleton />
      </div>
    ))
    .with("wallet", () => <WalletSkeleton />)
    .with("transaction", () => <TransactionSkeleton />)
    .with("providers", () => (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <ProviderSkeleton key={`provider-skeleton-${index}`} />
        ))}
      </div>
    ))
    .otherwise(() => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ));
};

export const LoadingState = memo(
  ({ type = "general", message, showSpinner = true, className = "" }: LoadingStateProps) => {
    const messages = useMemo(
      () => ({
        tokens: "Loading tokens...",
        quote: "Fetching quote...",
        wallet: "Loading wallets...",
        transaction: "Processing transaction...",
        providers: "Loading providers...",
        general: "Loading...",
      }),
      [],
    );

    const displayMessage = message || messages[type];

    return (
      <div className={`w-full ${className}`}>
        {showSpinner && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="large" className="text-accent-primary mb-4" />
            <p className="text-text-secondary font-medium">{displayMessage}</p>
            {type === "quote" && (
              <p className="text-text-tertiary text-sm mt-2 text-center max-w-xs">
                Searching across multiple DEXes for the best price
              </p>
            )}
            {type === "transaction" && (
              <p className="text-text-tertiary text-sm mt-2 text-center max-w-xs">
                This may take a few minutes depending on network conditions
              </p>
            )}
          </div>
        )}

        {!showSpinner && (
          <div className="space-y-4">
            {message && (
              <div className="text-center py-4">
                <p className="text-text-secondary font-medium">{message}</p>
              </div>
            )}

            {renderSkeletonContent(type)}
          </div>
        )}
      </div>
    );
  },
);

LoadingState.displayName = "LoadingState";

// Specific loading components for common use cases
export const TokenListLoading = memo(() => <LoadingState type="tokens" showSpinner={false} />);
TokenListLoading.displayName = "TokenListLoading";

export const QuoteLoading = memo(() => (
  <LoadingState type="quote" message="Getting the best rates..." showSpinner={true} />
));
QuoteLoading.displayName = "QuoteLoading";

export const WalletListLoading = memo(() => <LoadingState type="wallet" showSpinner={false} />);
WalletListLoading.displayName = "WalletListLoading";

export const TransactionLoading = memo(() => (
  <LoadingState type="transaction" message="Transaction submitted" showSpinner={true} />
));
TransactionLoading.displayName = "TransactionLoading";

export const ProviderListLoading = memo(() => (
  <LoadingState type="providers" showSpinner={false} />
));
ProviderListLoading.displayName = "ProviderListLoading";

// Inline loading components for smaller areas
export const InlineSpinner = memo(({ size = "small" }: { size?: "small" | "medium" }) => (
  <div className="flex items-center gap-2">
    <LoadingSpinner size={size} className="text-accent-primary" />
    <span className="text-text-secondary text-sm">Loading...</span>
  </div>
));

InlineSpinner.displayName = "InlineSpinner";

export const ButtonSpinner = memo(() => <LoadingSpinner size="small" className="text-current" />);
ButtonSpinner.displayName = "ButtonSpinner";
