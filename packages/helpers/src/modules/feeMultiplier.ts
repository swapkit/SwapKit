import { FeeOption } from "../types";
import { SKConfig } from "./swapKitConfig";

export interface FeeMultiplierConfig {
  [FeeOption.Average]: number;
  [FeeOption.Fast]: number;
  [FeeOption.Fastest]: number;
}

const DEFAULT_FEE_MULTIPLIERS: FeeMultiplierConfig = {
  [FeeOption.Average]: 1.0,
  [FeeOption.Fast]: 1.5,
  [FeeOption.Fastest]: 2.0,
};

/**
 * Get fee multiplier for the given fee option.
 * Checks SKConfig for custom multipliers first, then falls back to defaults.
 *
 * @param feeOption - The fee option (Average, Fast, Fastest)
 * @returns The fee multiplier as a number
 */
export function getFeeMultiplier(feeOption: FeeOption = FeeOption.Average): number {
  const customMultipliers = SKConfig.get("feeMultipliers");

  if (customMultipliers && customMultipliers[feeOption] !== undefined) {
    return customMultipliers[feeOption];
  }

  return DEFAULT_FEE_MULTIPLIERS[feeOption];
}

/**
 * Get fee multiplier as BigInt for EVM calculations.
 * Returns numerator and denominator for precise BigInt arithmetic.
 *
 * @param feeOption - The fee option (Average, Fast, Fastest)
 * @returns Object with numerator and denominator for BigInt calculations
 */
export function getFeeMultiplierAsBigInt(feeOption: FeeOption = FeeOption.Average): {
  numerator: bigint;
  denominator: bigint;
} {
  const multiplier = getFeeMultiplier(feeOption);

  // Convert decimal multiplier to fraction for precise BigInt arithmetic
  // e.g., 1.5 -> 15/10, 2.0 -> 20/10
  const denominator = 10n;
  const numerator = BigInt(Math.round(multiplier * 10));

  return { denominator, numerator };
}

/**
 * Apply fee multiplier to a BigInt value (for EVM chains).
 *
 * @param value - The base fee value as BigInt
 * @param feeOption - The fee option (Average, Fast, Fastest)
 * @returns The multiplied fee value as BigInt
 */
export function applyFeeMultiplierToBigInt(value: bigint, feeOption: FeeOption = FeeOption.Average) {
  const { numerator, denominator } = getFeeMultiplierAsBigInt(feeOption);
  return (value * numerator) / denominator;
}

/**
 * Apply fee multiplier to a number value (for non-EVM chains).
 *
 * @param value - The base fee value as number
 * @param feeOption - The fee option (Average, Fast, Fastest)
 * @param floor - Whether to floor the result (default: false)
 * @returns The multiplied fee value as number
 */
export function applyFeeMultiplier(value: number, feeOption: FeeOption = FeeOption.Average, floor = false): number {
  const multiplier = getFeeMultiplier(feeOption);
  const result = value * multiplier;
  return floor ? Math.floor(result) : result;
}

export { DEFAULT_FEE_MULTIPLIERS };
