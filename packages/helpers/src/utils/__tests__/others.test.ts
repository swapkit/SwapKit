import { describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/types";

import { findAssetBy } from "../asset";
import { getChainIdentifier, getMAYANameCost, getTHORNameCost, warnOnce, wrapWithThrow } from "../others";

describe("getTHORNameCost", () => {
  test("returns 10 + numberOfYears", () => {
    expect(getTHORNameCost(0)).toBe(10);
    expect(getTHORNameCost(1)).toBe(11);
    expect(getTHORNameCost(5)).toBe(15);
    expect(getTHORNameCost(10)).toBe(20);
  });

  test("throws for negative years in THORName cost", () => {
    expect(() => getTHORNameCost(-1)).toThrow("helpers_invalid_number_of_years");
    expect(() => getTHORNameCost(-100)).toThrow("helpers_invalid_number_of_years");
  });
});

describe("getMAYANameCost", () => {
  test("returns 10 + (numberOfYears * 1.0512)", () => {
    expect(getMAYANameCost(0)).toBe(10);
    expect(getMAYANameCost(1)).toBe(11.0512);
    expect(getMAYANameCost(5)).toBeCloseTo(15.256, 3);
    expect(getMAYANameCost(10)).toBeCloseTo(20.512, 3);
  });

  test("throws for negative years in MAYAName cost", () => {
    expect(() => getMAYANameCost(-1)).toThrow("helpers_invalid_number_of_years");
  });
});

describe("getChainIdentifier", () => {
  test("returns CHAIN.RUNE for THORChain", () => {
    expect(getChainIdentifier(Chain.THORChain)).toBe("THOR.RUNE");
  });

  test("returns CHAIN.ATOM for Cosmos", () => {
    expect(getChainIdentifier(Chain.Cosmos)).toBe("GAIA.ATOM");
  });

  test("returns CHAIN only for BinanceSmartChain", () => {
    expect(getChainIdentifier(Chain.BinanceSmartChain)).toBe("BSC");
  });

  test("returns CHAIN.CHAIN for other chains", () => {
    expect(getChainIdentifier(Chain.Bitcoin)).toBe("BTC.BTC");
    expect(getChainIdentifier(Chain.Ethereum)).toBe("ETH.ETH");
    expect(getChainIdentifier(Chain.Avalanche)).toBe("AVAX.AVAX");
  });
});

describe("wrapWithThrow", () => {
  test("returns function result on success", () => {
    expect(wrapWithThrow(() => 42)).toBe(42);
    expect(wrapWithThrow(() => "hello")).toBe("hello");
    expect(wrapWithThrow(() => ({ a: 1 }))).toEqual({ a: 1 });
  });

  test("returns undefined on error without errorKey", () => {
    expect(
      wrapWithThrow(() => {
        throw new Error("test");
      }),
    ).toBeUndefined();
  });

  test("throws SwapKitError when errorKey provided", () => {
    expect(() =>
      wrapWithThrow(() => {
        throw new Error("test");
      }, "helpers_invalid_identifier"),
    ).toThrow("helpers_invalid_identifier");
  });
});

describe("warnOnce", () => {
  // Note: warnOnce skips console.warn in test environment (NODE_ENV=test)
  // We test the behavior by calling the function multiple times and observing
  // that the function doesn't throw and handles repeated calls gracefully

  test("does not throw when condition is false", () => {
    expect(() => warnOnce({ condition: false, id: "test_false_condition", warning: "should not warn" })).not.toThrow();
  });

  test("does not throw when condition is true", () => {
    const uniqueId = `test_warns_${Date.now()}`;
    expect(() => warnOnce({ condition: true, id: uniqueId, warning: "test warning message" })).not.toThrow();
  });

  test("handles repeated calls with same id without throwing", () => {
    const uniqueId = `test_once_${Date.now()}`;
    expect(() => {
      warnOnce({ condition: true, id: uniqueId, warning: "first warn" });
      warnOnce({ condition: true, id: uniqueId, warning: "second warn" });
      warnOnce({ condition: true, id: uniqueId, warning: "third warn" });
    }).not.toThrow();
  });

  test("handles multiple different ids without throwing", () => {
    const uniqueId1 = `test_different_1_${Date.now()}`;
    const uniqueId2 = `test_different_2_${Date.now()}`;
    expect(() => {
      warnOnce({ condition: true, id: uniqueId1, warning: "warn 1" });
      warnOnce({ condition: true, id: uniqueId2, warning: "warn 2" });
    }).not.toThrow();
  });
});

describe("getAssetBy", () => {
  test("find ETH asset by identifier", async () => {
    const assetByIdentifier = await findAssetBy({ identifier: "ETH.ETH" });
    expect(assetByIdentifier).toBe("ETH.ETH");
  });

  test("find ETH token by chain and contract", async () => {
    const assetByChainAndContract = await findAssetBy({
      chain: Chain.Ethereum,
      contract: "0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
    });
    expect(assetByChainAndContract?.toUpperCase()).toBe("ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48");
  });

  test("return undefined if asset can't be found", async () => {
    const assetByIdentifier = await findAssetBy({ identifier: "ARB.NOTEXISTINGTOKEN" });
    const assetByChainAndContract = await findAssetBy({ chain: Chain.Ethereum, contract: "NOTFOUND" });
    expect(assetByIdentifier).toBeUndefined();
    expect(assetByChainAndContract).toBeUndefined();
  });

  describe(Chain.Radix, () => {
    test("find Radix XRD by identifier", async () => {
      const assetByChainAndContract = await findAssetBy({ identifier: "XRD.XRD" });
      expect(assetByChainAndContract?.toUpperCase()).toBe("XRD.XRD".toUpperCase());
    });

    test("find Radix token by chain and contract", async () => {
      const assetByChainAndContract = await findAssetBy({
        chain: Chain.Radix,
        contract: "resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
      });
      expect(assetByChainAndContract?.toUpperCase()).toBe(
        "XRD.XWBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75".toUpperCase(),
      );
    });
  });

  describe(Chain.Solana, () => {
    test("find Solana SOL by identifier", async () => {
      const assetByChainAndContract = await findAssetBy({ identifier: "SOL.SOL" });
      expect(assetByChainAndContract?.toUpperCase()).toBe("SOL.SOL".toUpperCase());
    });

    test("find Solana token by chain and contract", async () => {
      const assetByChainAndContract = await findAssetBy({
        chain: Chain.Solana,
        contract: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      });
      expect(assetByChainAndContract?.toUpperCase()).toBe(
        "SOL.USDC-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".toUpperCase(),
      );
    });
  });
});
