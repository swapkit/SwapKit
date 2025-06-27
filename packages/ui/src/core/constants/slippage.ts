export interface SlippagePreset {
  label: string;
  value: number;
  description?: string;
}

export const SLIPPAGE_PRESETS: SlippagePreset[] = [
  { label: "0.1%", value: 0.1, description: "Very low slippage, may fail" },
  { label: "0.5%", value: 0.5, description: "Recommended for stable pairs" },
  { label: "1%", value: 1, description: "Recommended for most swaps" },
  { label: "3%", value: 3, description: "Recommended for most swaps" },
  { label: "5%", value: 5, description: "High slippage tolerance" },
  { label: "10%", value: 10, description: "Very high slippage tolerance" },
];

export const DEFAULT_SLIPPAGE = 1; // 1%
export const MIN_SLIPPAGE = 0.01; // 0.01%
export const MAX_SLIPPAGE = 50; // 50%
