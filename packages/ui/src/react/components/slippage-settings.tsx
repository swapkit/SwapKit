import { memo, useCallback, useEffect, useState } from "react";
import {
  SLIPPAGE_PRESETS,
  type SlippagePreset,
  formatSlippageInput,
  getSlippageColor,
  getSlippageRisk,
  validateSlippage,
} from "../../core";

type SlippageSettingsProps = {
  value: number;
  onChange: (slippage: number) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  showAdvanced?: boolean;
  onAdvancedToggle?: (isAdvanced: boolean) => void;
};

const SlippageHeader = memo(
  ({
    value,
    label,
    showAdvanced,
    onAdvancedToggle,
  }: {
    value: number;
    label: string;
    showAdvanced?: boolean;
    onAdvancedToggle?: (isAdvanced: boolean) => void;
  }) => (
    <div className="flex items-center justify-between">
      <div>
        <label
          htmlFor="slippage-settings"
          className="text-xs sm:text-sm font-medium text-text-primary"
        >
          {label}
        </label>
        <div id="slippage-settings" className="flex items-center gap-2 mt-1">
          <span className={`text-base sm:text-lg font-semibold ${getSlippageColor(value)}`}>
            {value}%
          </span>
          <span className="text-xs text-text-secondary">({getSlippageRisk(value)})</span>
        </div>
      </div>

      {onAdvancedToggle && (
        <button
          type="button"
          onClick={() => onAdvancedToggle(!showAdvanced)}
          className="text-xs sm:text-sm text-accent-primary hover:text-accent-hover transition-colors min-h-[32px] touch-manipulation flex items-center"
        >
          {showAdvanced ? "Hide advanced" : "Advanced"}
        </button>
      )}
    </div>
  ),
);

const PresetButton = memo(
  ({
    preset,
    isSelected,
    disabled,
    onClick,
  }: {
    preset: SlippagePreset;
    isSelected: boolean;
    disabled?: boolean;
    onClick: () => void;
  }) => (
    <button
      key={preset.value}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 min-h-[40px] touch-manipulation ${
        disabled
          ? "bg-background-secondary border-border-secondary text-text-tertiary cursor-not-allowed"
          : isSelected
            ? "bg-primary-default border-primary-default text-white"
            : "bg-background-surface border-border-secondary text-text-primary hover:border-border-hover hover:bg-background-hover"
      }`}
    >
      {preset.label}
    </button>
  ),
);

const CustomInput = memo(
  ({
    value,
    onChange,
    onFocus,
    onBlur,
    disabled,
    validation,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    onBlur: () => void;
    disabled?: boolean;
    validation: ReturnType<typeof validateSlippage>;
  }) => (
    <div className="flex-1 relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="0.50"
        disabled={disabled}
        className={`w-full px-3 py-2 pr-8 rounded-lg border-2 text-xs sm:text-sm transition-all min-h-[40px] ${
          disabled
            ? "bg-background-secondary border-border-secondary text-text-tertiary cursor-not-allowed"
            : validation.isValid
              ? validation.warning
                ? "border-warning-default bg-warning-surface focus:border-warning-hover focus:ring-4 focus:ring-warning-surface"
                : "border-border-secondary bg-background-primary focus:border-primary-default focus:ring-4 focus:ring-primary-surface text-text-primary"
              : "border-error-default bg-error-surface text-error-default focus:border-error-hover focus:ring-4 focus:ring-error-surface"
        } focus:outline-none`}
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-text-secondary">
        %
      </span>
    </div>
  ),
);

const ValidationMessage = memo(
  ({
    validation,
    isCustom,
  }: {
    validation: ReturnType<typeof validateSlippage>;
    isCustom: boolean;
  }) => {
    if (!isCustom) return null;

    if (!validation.isValid && validation.error) {
      return (
        <div className="flex items-start gap-2 text-xs sm:text-sm text-error-default">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="none"
            aria-label="Error"
          >
            <title>Error</title>
            <path
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              fill="currentColor"
            />
          </svg>
          <span>{validation.error}</span>
        </div>
      );
    }

    if (validation.isValid && validation.warning) {
      return (
        <div className="flex items-start gap-2 text-xs sm:text-sm text-warning-default">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="none"
            aria-label="Warning"
          >
            <title>Warning</title>
            <path
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              fill="currentColor"
            />
          </svg>
          <span>{validation.warning}</span>
        </div>
      );
    }

    return null;
  },
);

export const SlippageSettings = memo(function SlippageSettings({
  value,
  onChange,
  label = "Slippage tolerance",
  disabled = false,
  className = "",
  showAdvanced = false,
  onAdvancedToggle,
}: SlippageSettingsProps) {
  const [isCustom, setIsCustom] = useState(
    !SLIPPAGE_PRESETS.some((preset) => preset.value === value),
  );
  const [customInput, setCustomInput] = useState(value.toString());
  const [validation, setValidation] = useState(validateSlippage(value));
  const [isFocused, setIsFocused] = useState(false);

  const validateAndUpdate = useCallback((slippage: number) => {
    const result = validateSlippage(slippage);
    setValidation(result);
    return result.isValid;
  }, []);

  useEffect(() => {
    validateAndUpdate(value);
    if (!isFocused) {
      setCustomInput(value.toString());
    }
  }, [value, validateAndUpdate, isFocused]);

  const handlePresetSelect = (preset: SlippagePreset) => {
    if (disabled) return;

    setIsCustom(false);
    setCustomInput(preset.value.toString());
    onChange(preset.value);
  };

  const handleCustomToggle = () => {
    if (disabled) return;

    const newIsCustom = !isCustom;
    setIsCustom(newIsCustom);

    if (newIsCustom) {
      setCustomInput(value.toString());
    } else {
      onChange(1);
      setCustomInput("1");
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSlippageInput(e.target.value);
    setCustomInput(formatted);

    const numValue = Number(formatted);
    if (formatted && !Number.isNaN(numValue) && validateAndUpdate(numValue)) {
      onChange(numValue);
    }
  };

  const handleCustomInputBlur = () => {
    setIsFocused(false);
    const numValue = Number(customInput);

    if (!customInput || Number.isNaN(numValue)) {
      setCustomInput(value.toString());
      return;
    }

    if (validateAndUpdate(numValue)) {
      onChange(numValue);
    }
  };

  const handleCustomInputFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <SlippageHeader
        value={value}
        label={label}
        showAdvanced={showAdvanced}
        onAdvancedToggle={onAdvancedToggle}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SLIPPAGE_PRESETS.map((preset) => {
          const isSelected = !isCustom && preset.value === value;
          return (
            <PresetButton
              key={preset.value}
              preset={preset}
              isSelected={isSelected}
              disabled={disabled}
              onClick={() => handlePresetSelect(preset)}
            />
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCustomToggle}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 min-h-[40px] touch-manipulation ${
              disabled
                ? "bg-background-secondary border-border-secondary text-text-tertiary cursor-not-allowed"
                : isCustom
                  ? "bg-primary-default border-primary-default text-white"
                  : "bg-background-surface border-border-secondary text-text-primary hover:border-border-hover hover:bg-background-hover"
            }`}
          >
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                isCustom ? "border-white bg-white" : "border-border-primary"
              }`}
            >
              {isCustom && (
                <svg
                  className="w-3 h-3 text-primary-default"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            Custom
          </button>

          {isCustom && (
            <CustomInput
              value={customInput}
              onChange={handleCustomInputChange}
              onFocus={handleCustomInputFocus}
              onBlur={handleCustomInputBlur}
              disabled={disabled || !isCustom}
              validation={validation}
            />
          )}
        </div>

        <ValidationMessage validation={validation} isCustom={isCustom} />
      </div>

      {showAdvanced && (
        <div className="pt-4 border-t border-border-secondary space-y-3">
          <h4 className="text-xs sm:text-sm font-medium text-text-primary">Advanced Settings</h4>

          <div className="bg-background-surface rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="text-text-secondary mb-1">Transaction deadline</div>
                <div className="font-medium text-text-primary">20 minutes</div>
              </div>
              <div>
                <div className="text-text-secondary mb-1">MEV protection</div>
                <div className="font-medium text-success-default">Enabled</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-background-surface rounded-lg p-2 sm:p-3">
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
            <p className="font-medium mb-1">About slippage tolerance</p>
            <p>
              Your transaction will revert if the price changes unfavorably by more than this
              percentage. Higher tolerance reduces failure risk but may result in worse rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
