import { memo, useCallback } from "react";
import { CloseIcon } from "./icons";
import { SlippageSettings } from "./slippage-settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  onSlippageChange: (slippage: number) => void;
}

export const SettingsModal = memo(function SettingsModal({
  isOpen,
  onClose,
  slippage,
  onSlippageChange,
}: SettingsModalProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div
        className="bg-background-secondary rounded-2xl p-4 sm:p-6 max-w-[480px] w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="relative mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary pr-10">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-0 p-2 hover:bg-background-hover rounded-lg transition-colors touch-manipulation"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        <SlippageSettings value={slippage} onChange={onSlippageChange} showAdvanced={false} />
      </div>
    </div>
  );
});
