import { useEffect, useRef } from "react";
import type { TransactionStatus } from "../types/swap.types";
import { CloseIcon } from "./icons";

type TransactionStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  txHash?: string;
  inputAsset?: { symbol: string; amount: string };
  outputAsset?: { symbol: string; amount: string };
  onRetry?: () => void;
  onViewExplorer?: (hash: string) => void;
  estimatedTime?: number;
  confirmations?: number;
  requiredConfirmations?: number;
  error?: {
    code: string;
    message: string;
  };
};

const truncateHash = (hash: string, length = 8) => {
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
};

const StatusIcon = ({ status }: { status: TransactionStatus }) => {
  const baseClasses =
    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative";

  switch (status) {
    case "pending":
      return (
        <div className={`${baseClasses} bg-[#2A2A2A]`}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse" />
          <svg
            className="w-10 h-10 text-blue-400 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Transaction pending"
          >
            <title>Transaction pending</title>
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
        </div>
      );

    case "confirming":
      return (
        <div className={`${baseClasses} bg-[#2A2A2A]`}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 opacity-30 animate-pulse" />
          <div className="relative">
            <svg
              className="w-10 h-10 text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="Transaction confirming"
            >
              <title>Transaction confirming</title>
              <path
                d="M12 2v4m0 12v4m10-10h-4M6 12H2"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <circle cx="12" cy="12" r="5" fill="currentColor" className="animate-pulse" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            </div>
          </div>
        </div>
      );

    case "success":
      return (
        <div className={`${baseClasses} bg-[#1A3A2A]`}>
          <div className="absolute inset-0 rounded-full bg-green-500 opacity-20" />
          <svg
            className="w-10 h-10 text-green-400 animate-in zoom-in duration-300"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Transaction successful"
          >
            <title>Transaction successful</title>
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case "error":
      return (
        <div className={`${baseClasses} bg-[#3A1A1A]`}>
          <div className="absolute inset-0 rounded-full bg-red-500 opacity-20" />
          <svg
            className="w-10 h-10 text-red-400 animate-in zoom-in duration-300"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Transaction failed"
          >
            <title>Transaction failed</title>
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    default:
      return null;
  }
};

const getStatusText = (
  status: TransactionStatus,
  confirmations?: number,
  requiredConfirmations?: number,
) => {
  switch (status) {
    case "pending":
      return {
        title: "Transaction submitted",
        description: "Your swap is being processed on the blockchain",
      };

    case "confirming":
      return {
        title: "Confirming transaction",
        description:
          confirmations && requiredConfirmations
            ? `${confirmations} of ${requiredConfirmations} confirmations`
            : "Waiting for network confirmations",
      };

    case "success":
      return {
        title: "Swap completed!",
        description: "Your transaction was successful",
      };

    case "error":
      return {
        title: "Transaction failed",
        description: "Your swap could not be completed",
      };

    default:
      return {
        title: "Unknown status",
        description: "Transaction status unknown",
      };
  }
};

const TransactionDetails = ({
  inputAsset,
  outputAsset,
  txHash,
  status,
}: {
  inputAsset?: { symbol: string; amount: string };
  outputAsset?: { symbol: string; amount: string };
  txHash?: string;
  status: TransactionStatus;
}) => {
  if (!inputAsset) {
    if (!outputAsset) return null;
  }

  return (
    <div className="bg-[#1C1C1C] rounded-xl p-4 mb-4">
      <h4 className="text-xs text-[#6B7280] uppercase tracking-wider mb-3">Transaction details</h4>
      <div className="space-y-3">
        {inputAsset && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {inputAsset.symbol.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-[#9CA3AF]">You paid</span>
            </div>
            <span className="text-sm font-medium text-white">
              {inputAsset.amount} {inputAsset.symbol}
            </span>
          </div>
        )}
        {outputAsset &&
          (status === "success" || status === "pending" || status === "confirming") && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {outputAsset.symbol.charAt(0)}
                  </span>
                </div>
                <span className="text-sm text-[#9CA3AF]">
                  {status === "success" ? "You received" : "You will receive"}
                </span>
              </div>
              <span className="text-sm font-medium text-white">
                {outputAsset.amount} {outputAsset.symbol}
              </span>
            </div>
          )}
      </div>
      {txHash && (
        <div className="mt-4 pt-3 border-t border-[#2A2A2A]">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Transaction hash</span>
            <span className="text-xs font-mono text-[#60A5FA]">{truncateHash(txHash)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ProgressInfo = ({
  estimatedTime,
  confirmations,
  requiredConfirmations,
}: {
  estimatedTime?: number;
  confirmations?: number;
  requiredConfirmations?: number;
}) => {
  const estimatedMinutes = estimatedTime ? Math.round(estimatedTime / 60) : null;
  const progress =
    confirmations && requiredConfirmations
      ? Math.min((confirmations / requiredConfirmations) * 100, 100)
      : 0;

  return (
    <div className="bg-[#1C1C1C] rounded-xl p-4 mb-4">
      <div className="space-y-3">
        {estimatedMinutes && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#9CA3AF]">Estimated time</span>
            <span className="text-sm font-medium text-white">~{estimatedMinutes} min</span>
          </div>
        )}
        {confirmations !== undefined && requiredConfirmations && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#9CA3AF]">Confirmations</span>
              <span className="text-sm font-medium text-white">
                {confirmations} / {requiredConfirmations}
              </span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ErrorDetails = ({ error }: { error?: { code: string; message: string } }) => {
  if (!error) return null;

  return (
    <div className="bg-[#2A1A1A] border border-red-900/50 rounded-xl p-4 mb-4">
      <h4 className="font-medium text-red-400 mb-2 text-sm">Error details</h4>
      <div className="space-y-2">
        <div>
          <span className="text-xs text-[#9CA3AF]">Code: </span>
          <span className="text-xs font-mono text-red-300">{error.code}</span>
        </div>
        <div>
          <span className="text-xs text-[#9CA3AF]">Message: </span>
          <span className="text-xs text-red-300">{error.message}</span>
        </div>
      </div>
    </div>
  );
};

const ActionButtons = ({
  status,
  onClose,
  onRetry,
  txHash,
  onViewExplorer,
}: {
  status: TransactionStatus;
  onClose: () => void;
  onRetry?: () => void;
  txHash?: string;
  onViewExplorer?: (hash: string) => void;
}) => {
  return (
    <div className="space-y-3 mt-6">
      {status === "success" && (
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 min-h-[48px] transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Done
        </button>
      )}

      {status === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 min-h-[48px] transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Try again
        </button>
      )}

      {txHash && onViewExplorer && (
        <button
          type="button"
          onClick={() => onViewExplorer(txHash)}
          className="w-full bg-[#2A2A2A] hover:bg-[#333333] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 min-h-[48px] flex items-center justify-center gap-2"
        >
          <span>View on explorer</span>
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333M10 2H14M14 2V6M14 2L7.33333 8.66667"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export const TransactionStatusModal = ({
  isOpen,
  onClose,
  status,
  txHash,
  inputAsset,
  outputAsset,
  onRetry,
  onViewExplorer,
  estimatedTime,
  confirmations,
  requiredConfirmations,
  error,
}: TransactionStatusModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const canClose = status === "success" || status === "error";

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canClose) onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, canClose]);

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && canClose) {
      onClose();
    }
  };

  const statusText = getStatusText(status, confirmations, requiredConfirmations);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={handleModalClick}
      onKeyDown={(e) => {
        if (e.key === "Escape" && canClose) {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        className="bg-[#141514] rounded-t-3xl sm:rounded-2xl shadow-modal w-full sm:w-[360px] max-h-[85vh] sm:max-h-[640px] flex flex-col overflow-hidden animate-slideUp"
      >
        <div className="relative px-4 pt-6 pb-4">
          <h2 className="text-[20px] font-medium text-white leading-6">Transaction status</h2>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors p-2 -m-2 w-10 h-10 flex items-center justify-center"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="text-center">
            <StatusIcon status={status} />

            <h3 className="text-xl font-semibold text-white mb-2">{statusText.title}</h3>

            <p className="text-sm text-[#9CA3AF] mb-6">{statusText.description}</p>

            <TransactionDetails
              inputAsset={inputAsset}
              outputAsset={outputAsset}
              txHash={txHash}
              status={status}
            />

            {(status === "pending" || status === "confirming") && (
              <ProgressInfo
                estimatedTime={estimatedTime}
                confirmations={confirmations}
                requiredConfirmations={requiredConfirmations}
              />
            )}

            {status === "error" && <ErrorDetails error={error} />}

            <ActionButtons
              status={status}
              onClose={onClose}
              onRetry={onRetry}
              txHash={txHash}
              onViewExplorer={onViewExplorer}
            />

            {(status === "pending" || status === "confirming") && (
              <div className="mt-4 p-3 bg-[#1C1C1C] rounded-lg border border-[#2A2A2A]">
                <div className="flex gap-2">
                  <svg
                    className="w-4 h-4 text-[#60A5FA] flex-shrink-0 mt-0.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-label="Information"
                  >
                    <title>Information</title>
                    <path
                      d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 10.5V8M8 5.5H8.005"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-xs text-[#9CA3AF] text-left">
                    Your transaction is being processed. You can safely close this window and the
                    swap will continue in the background.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
