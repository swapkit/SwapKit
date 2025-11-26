import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { FeeOption } from "../../types";
import {
  applyFeeMultiplier,
  applyFeeMultiplierToBigInt,
  DEFAULT_FEE_MULTIPLIERS,
  getFeeMultiplier,
  getFeeMultiplierAsBigInt,
} from "../feeMultiplier";
import { SKConfig } from "../swapKitConfig";

describe("feeMultiplier", () => {
  beforeEach(() => {
    SKConfig.reinitialize();
  });

  afterEach(() => {
    SKConfig.reinitialize();
  });

  describe("getFeeMultiplier", () => {
    test("returns 1.0 for Average, 1.5 for Fast, 2.0 for Fastest", () => {
      expect(getFeeMultiplier(FeeOption.Average)).toBe(1.0);
      expect(getFeeMultiplier(FeeOption.Fast)).toBe(1.5);
      expect(getFeeMultiplier(FeeOption.Fastest)).toBe(2.0);
    });

    test("defaults to Average when no option provided", () => {
      expect(getFeeMultiplier()).toBe(1.0);
    });

    test("uses custom multipliers from SKConfig when set", () => {
      SKConfig.set({ feeMultipliers: { [FeeOption.Average]: 1.2, [FeeOption.Fast]: 1.8, [FeeOption.Fastest]: 2.5 } });

      expect(getFeeMultiplier(FeeOption.Average)).toBe(1.2);
      expect(getFeeMultiplier(FeeOption.Fast)).toBe(1.8);
      expect(getFeeMultiplier(FeeOption.Fastest)).toBe(2.5);
    });
  });

  describe("getFeeMultiplierAsBigInt", () => {
    test("converts multipliers to numerator/denominator for precise bigint math", () => {
      expect(getFeeMultiplierAsBigInt(FeeOption.Average)).toEqual({ denominator: 10n, numerator: 10n });
      expect(getFeeMultiplierAsBigInt(FeeOption.Fast)).toEqual({ denominator: 10n, numerator: 15n });
      expect(getFeeMultiplierAsBigInt(FeeOption.Fastest)).toEqual({ denominator: 10n, numerator: 20n });
    });

    test("defaults to Average for bigint multiplier", () => {
      expect(getFeeMultiplierAsBigInt()).toEqual({ denominator: 10n, numerator: 10n });
    });
  });

  describe("applyFeeMultiplierToBigInt", () => {
    test("applies multiplier to bigint values", () => {
      expect(applyFeeMultiplierToBigInt(100n, FeeOption.Average)).toBe(100n);
      expect(applyFeeMultiplierToBigInt(100n, FeeOption.Fast)).toBe(150n);
      expect(applyFeeMultiplierToBigInt(100n, FeeOption.Fastest)).toBe(200n);
    });

    test("handles large values without overflow", () => {
      expect(applyFeeMultiplierToBigInt(1000000000000000000n, FeeOption.Fastest)).toBe(2000000000000000000n);
    });

    test("defaults to Average for applyFeeMultiplierToBigInt", () => {
      expect(applyFeeMultiplierToBigInt(100n)).toBe(100n);
    });
  });

  describe("applyFeeMultiplier", () => {
    test("applies multiplier to number values", () => {
      expect(applyFeeMultiplier(100, FeeOption.Average)).toBe(100);
      expect(applyFeeMultiplier(100, FeeOption.Fast)).toBe(150);
      expect(applyFeeMultiplier(100, FeeOption.Fastest)).toBe(200);
    });

    test("floors result when floor=true", () => {
      expect(applyFeeMultiplier(33, FeeOption.Fast, true)).toBe(49);
      expect(applyFeeMultiplier(10.5, FeeOption.Fastest, true)).toBe(21);
    });

    test("preserves decimals when floor=false", () => {
      expect(applyFeeMultiplier(33, FeeOption.Fast, false)).toBe(49.5);
    });

    test("defaults to Average for applyFeeMultiplier", () => {
      expect(applyFeeMultiplier(100)).toBe(100);
    });
  });

  describe("DEFAULT_FEE_MULTIPLIERS", () => {
    test("exports correct default values", () => {
      expect(DEFAULT_FEE_MULTIPLIERS[FeeOption.Average]).toBe(1.0);
      expect(DEFAULT_FEE_MULTIPLIERS[FeeOption.Fast]).toBe(1.5);
      expect(DEFAULT_FEE_MULTIPLIERS[FeeOption.Fastest]).toBe(2.0);
    });
  });

  describe("edge cases", () => {
    test("applies multiplier to zero value", () => {
      expect(applyFeeMultiplierToBigInt(0n, FeeOption.Fastest)).toBe(0n);
      expect(applyFeeMultiplier(0, FeeOption.Fastest)).toBe(0);
    });

    test("handles negative numbers", () => {
      expect(applyFeeMultiplier(-100, FeeOption.Fast)).toBe(-150);
      expect(applyFeeMultiplier(-100, FeeOption.Fastest)).toBe(-200);
    });

    test("handles negative bigint values", () => {
      expect(applyFeeMultiplierToBigInt(-100n, FeeOption.Fast)).toBe(-150n);
      expect(applyFeeMultiplierToBigInt(-100n, FeeOption.Fastest)).toBe(-200n);
    });

    test("handles decimal values with multiplier", () => {
      expect(applyFeeMultiplier(0.5, FeeOption.Fastest)).toBe(1);
      expect(applyFeeMultiplier(0.333, FeeOption.Fast)).toBeCloseTo(0.4995, 4);
    });

    test("handles very small bigint values", () => {
      expect(applyFeeMultiplierToBigInt(1n, FeeOption.Fast)).toBe(1n); // 1 * 15 / 10 = 1 (integer division)
      expect(applyFeeMultiplierToBigInt(5n, FeeOption.Fast)).toBe(7n); // 5 * 15 / 10 = 7
    });
  });
});
