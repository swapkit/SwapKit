import { describe, expect, test } from "bun:test";

import {
  getAsymmetricAssetShare,
  getAsymmetricAssetWithdrawAmount,
  getAsymmetricRuneShare,
  getAsymmetricRuneWithdrawAmount,
  getEstimatedPoolShare,
  getLiquiditySlippage,
  getSymmetricPoolShare,
  getSymmetricWithdraw,
} from "../liquidity";

describe("getAsymmetricRuneShare", () => {
  test("calculates rune share for typical pool position", () => {
    const result = getAsymmetricRuneShare({
      liquidityUnits: "100000000",
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    });
    expect(result.getValue("number")).toBeGreaterThan(0);
  });

  test("returns zero rune share for zero liquidity units", () => {
    const result = getAsymmetricRuneShare({ liquidityUnits: "0", poolUnits: "1000000000", runeDepth: "500000000000" });
    expect(result.getValue("number")).toBe(0);
  });

  test("returns full amount when owning all pool units", () => {
    const result = getAsymmetricRuneShare({
      liquidityUnits: "1000000000",
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    });
    expect(result.getValue("string")).toBe("5000");
  });
});

describe("getAsymmetricAssetShare", () => {
  test("calculates asset share for typical pool position", () => {
    const result = getAsymmetricAssetShare({
      assetDepth: "200000000000",
      liquidityUnits: "100000000",
      poolUnits: "1000000000",
    });
    expect(result.getValue("number")).toBeGreaterThan(0);
  });

  test("returns zero asset share for zero liquidity units", () => {
    const result = getAsymmetricAssetShare({
      assetDepth: "200000000000",
      liquidityUnits: "0",
      poolUnits: "1000000000",
    });
    expect(result.getValue("number")).toBe(0);
  });
});

describe("getAsymmetricRuneWithdrawAmount", () => {
  test("calculates withdrawal amount for 50% withdrawal", () => {
    const result = getAsymmetricRuneWithdrawAmount({
      liquidityUnits: "100000000",
      percent: 0.5,
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    });
    expect(result.getValue("number")).toBeGreaterThan(0);
  });

  test("calculates full withdrawal for 100%", () => {
    const full = getAsymmetricRuneWithdrawAmount({
      liquidityUnits: "100000000",
      percent: 1,
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    });
    const half = getAsymmetricRuneWithdrawAmount({
      liquidityUnits: "100000000",
      percent: 0.5,
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    });
    expect(full.getValue("number")).toBeCloseTo(half.getValue("number") * 2, 5);
  });
});

describe("getAsymmetricAssetWithdrawAmount", () => {
  test("calculates withdrawal for given percentage", () => {
    const result = getAsymmetricAssetWithdrawAmount({
      assetDepth: "200000000000",
      liquidityUnits: "100000000",
      percent: 0.25,
      poolUnits: "1000000000",
    });
    expect(result.getValue("number")).toBeGreaterThan(0);
  });
});

describe("getSymmetricPoolShare", () => {
  test("returns both rune and asset amounts", () => {
    const result = getSymmetricPoolShare({
      assetDepth: "200000000000",
      liquidityUnits: "100000000",
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    });
    expect(result.runeAmount.getValue("number")).toBeGreaterThan(0);
    expect(result.assetAmount.getValue("number")).toBeGreaterThan(0);
  });

  test("proportionally distributes based on liquidity units", () => {
    const result10 = getSymmetricPoolShare({
      assetDepth: "1000000000000",
      liquidityUnits: "100000000",
      poolUnits: "1000000000",
      runeDepth: "1000000000000",
    });
    const result20 = getSymmetricPoolShare({
      assetDepth: "1000000000000",
      liquidityUnits: "200000000",
      poolUnits: "1000000000",
      runeDepth: "1000000000000",
    });
    expect(result20.runeAmount.getValue("number")).toBeCloseTo(result10.runeAmount.getValue("number") * 2, 5);
  });
});

describe("getSymmetricWithdraw", () => {
  test("applies percentage to both amounts", () => {
    const result = getSymmetricWithdraw({
      assetDepth: "200000000000",
      liquidityUnits: "100000000",
      percent: 0.5,
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    });
    expect(result.runeAmount?.getValue("number")).toBeGreaterThan(0);
    expect(result.assetAmount?.getValue("number")).toBeGreaterThan(0);
  });

  test("full withdrawal equals pool share", () => {
    const params = {
      assetDepth: "200000000000",
      liquidityUnits: "100000000",
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    };
    const share = getSymmetricPoolShare(params);
    const withdraw = getSymmetricWithdraw({ ...params, percent: 1 });
    expect(withdraw.runeAmount?.getValue("string")).toBe(share.runeAmount.getValue("string"));
  });
});

describe("getEstimatedPoolShare", () => {
  test("estimates pool share after adding liquidity", () => {
    // Returns base value representation (with 8 decimals internally)
    // For ~4.76% share, base value is 4761905 (0.04761905 * 10^8)
    const result = getEstimatedPoolShare({
      assetAmount: "10000000000",
      assetDepth: "200000000000",
      liquidityUnits: "0",
      poolUnits: "1000000000",
      runeAmount: "25000000000",
      runeDepth: "500000000000",
    });
    expect(result).toBeGreaterThan(0);
    // Base value for percentage < 100% is < 10^8
    expect(result).toBeLessThan(100_000_000);
  });

  test("returns 0 when adding zero liquidity", () => {
    const result = getEstimatedPoolShare({
      assetAmount: "0",
      assetDepth: "200000000000",
      liquidityUnits: "0",
      poolUnits: "1000000000",
      runeAmount: "0",
      runeDepth: "500000000000",
    });
    expect(result).toBe(0);
  });
});

describe("getLiquiditySlippage", () => {
  test("returns 0 when any amount is zero", () => {
    expect(
      getLiquiditySlippage({ assetAmount: "0", assetDepth: "200000000000", runeAmount: "100", runeDepth: "500" }),
    ).toBe(0);
    expect(getLiquiditySlippage({ assetAmount: "100", assetDepth: "0", runeAmount: "100", runeDepth: "500" })).toBe(0);
    expect(getLiquiditySlippage({ assetAmount: "100", assetDepth: "200", runeAmount: "0", runeDepth: "500" })).toBe(0);
    expect(getLiquiditySlippage({ assetAmount: "100", assetDepth: "200", runeAmount: "100", runeDepth: "0" })).toBe(0);
  });

  test("calculates slippage for balanced add", () => {
    const result = getLiquiditySlippage({
      assetAmount: "100000000",
      assetDepth: "200000000000",
      runeAmount: "250000000",
      runeDepth: "500000000000",
    });
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });

  test("returns absolute value (no negatives)", () => {
    const result = getLiquiditySlippage({
      assetAmount: "1000000000",
      assetDepth: "200000000000",
      runeAmount: "100000000",
      runeDepth: "500000000000",
    });
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe("edge cases", () => {
  test("handles very large numbers without overflow", () => {
    const result = getAsymmetricRuneShare({
      liquidityUnits: "999999999999999999",
      poolUnits: "9999999999999999999",
      runeDepth: "99999999999999999999",
    });
    expect(result.getValue("number")).toBeGreaterThan(0);
  });

  test("getSymmetricPoolShare with equal depths", () => {
    const result = getSymmetricPoolShare({
      assetDepth: "1000000000000",
      liquidityUnits: "500000000",
      poolUnits: "1000000000",
      runeDepth: "1000000000000",
    });
    // 50% of pool should get 50% of both depths
    expect(result.runeAmount.getValue("string")).toBe(result.assetAmount.getValue("string"));
  });

  test("getEstimatedPoolShare with existing liquidity units", () => {
    const result = getEstimatedPoolShare({
      assetAmount: "10000000000",
      assetDepth: "200000000000",
      liquidityUnits: "50000000", // User already has some units
      poolUnits: "1000000000",
      runeAmount: "25000000000",
      runeDepth: "500000000000",
    });
    expect(result).toBeGreaterThan(0);
  });

  test("handles single-sided liquidity add (only rune)", () => {
    const result = getEstimatedPoolShare({
      assetAmount: "0",
      assetDepth: "200000000000",
      liquidityUnits: "0",
      poolUnits: "1000000000",
      runeAmount: "25000000000",
      runeDepth: "500000000000",
    });
    expect(result).toBeGreaterThan(0);
  });

  test("handles single-sided liquidity add (only asset)", () => {
    const result = getEstimatedPoolShare({
      assetAmount: "10000000000",
      assetDepth: "200000000000",
      liquidityUnits: "0",
      poolUnits: "1000000000",
      runeAmount: "0",
      runeDepth: "500000000000",
    });
    expect(result).toBeGreaterThan(0);
  });

  test("getAsymmetricRuneWithdrawAmount with 0% withdrawal returns 0", () => {
    const result = getAsymmetricRuneWithdrawAmount({
      liquidityUnits: "100000000",
      percent: 0,
      poolUnits: "1000000000",
      runeDepth: "500000000000",
    });
    expect(result.getValue("number")).toBe(0);
  });

  test("getLiquiditySlippage higher slippage for unbalanced add", () => {
    // Balanced add (proportional to pool)
    const balanced = getLiquiditySlippage({
      assetAmount: "100000000",
      assetDepth: "200000000000",
      runeAmount: "250000000",
      runeDepth: "500000000000",
    });

    // Unbalanced add (too much rune)
    const unbalanced = getLiquiditySlippage({
      assetAmount: "100000000",
      assetDepth: "200000000000",
      runeAmount: "1000000000", // Much higher rune
      runeDepth: "500000000000",
    });

    expect(unbalanced).toBeGreaterThan(balanced);
  });
});
