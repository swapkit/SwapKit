import { MAX_SLIPPAGE, MIN_SLIPPAGE } from "../constants";

export interface SlippageValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export function validateSlippage(slippage: number): SlippageValidationResult {
  if (slippage < MIN_SLIPPAGE) {
    return {
      isValid: false,
      error: `Slippage must be at least ${MIN_SLIPPAGE}%`,
    };
  }

  if (slippage > MAX_SLIPPAGE) {
    return {
      isValid: false,
      error: `Slippage cannot exceed ${MAX_SLIPPAGE}%`,
    };
  }

  if (slippage < 0.25) {
    return {
      isValid: true,
      warning: "Very low slippage may cause transaction failures",
    };
  }

  if (slippage >= 5) {
    return {
      isValid: true,
      warning: "High slippage tolerance may result in unfavorable rates",
    };
  }

  return { isValid: true };
}

export function formatSlippageInput(value: string): string {
  let cleaned = value.replace(/[^0-9.]/g, "");

  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
  }

  if (parts[1] && parts[1].length > 2) {
    cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }

  return cleaned;
}

export function getSlippageColor(slippageValue: number): string {
  if (slippageValue < 0.1) return "warning";
  if (slippageValue > 5) return "error";
  if (slippageValue >= 0.5 && slippageValue <= 1) return "success";
  return "default";
}

export function getSlippageRisk(slippageValue: number): string {
  if (slippageValue < 0.1) return "Very Low (may fail)";
  if (slippageValue <= 0.5) return "Low";
  if (slippageValue <= 1) return "Recommended";
  if (slippageValue <= 3) return "Medium";
  if (slippageValue <= 5) return "High";
  return "Very High";
}
