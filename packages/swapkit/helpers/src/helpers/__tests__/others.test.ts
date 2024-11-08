import { describe, expect, test } from "bun:test";
import { Chain } from "../../types";

import { findAssetBy } from "../asset";
import { getTHORNameCost } from "../others";

describe("getTHORNameCost", () => {
  describe("for correct values", () => {
    const costCases = [
      [1, 11],
      [2, 12],
      [3, 13],
      [10, 20],
    ];

    for (const [years = 0, expected = 10] of costCases) {
      test(`returns correct ${expected} cost for ${years} years`, () => {
        const result = getTHORNameCost(years);
        expect(result).toBe(expected);
      });
    }
  });

  test("throws an error for negative years", () => {
    expect(() => getTHORNameCost(-1)).toThrow("helpers_invalid_number_of_years");
  });
});

describe("getAssetBy", () => {
  test("find asset by identifier", async () => {
    const assetByIdentifier = await findAssetBy({ identifier: "ETH.ETH" });
    expect(assetByIdentifier).toBe("ETH.ETH");
  });

  test("find asset by chain and contract", async () => {
    const assetByChainAndContract = await findAssetBy({
      chain: Chain.Ethereum,
      contract: "0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
    });
    expect(assetByChainAndContract?.toUpperCase()).toBe(
      "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
    );
  });

  test("return undefined if asset can't be found", async () => {
    const assetByIdentifier = await findAssetBy({ identifier: "ARB.NOTEXISTINGTOKEN" });
    const assetByChainAndContract = await findAssetBy({
      chain: Chain.Ethereum,
      contract: "NOTFOUND",
    });
    expect(assetByIdentifier).toBeUndefined();
    expect(assetByChainAndContract).toBeUndefined();
  });

  test("find asset by chain and radix resource", async () => {
    const assetByChainAndContract = await findAssetBy({
      chain: Chain.Radix,
      contract: "resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
    });
    expect(assetByChainAndContract?.toUpperCase()).toBe(
      "XRD.XWBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75".toUpperCase(),
    );
  });

  test("find asset by radix identifier", async () => {
    const assetByChainAndContract = await findAssetBy({
      identifier: "XRD.XRD",
    });
    expect(assetByChainAndContract?.toUpperCase()).toBe("XRD.XRD".toUpperCase());
  });

  test("find asset by chain and Solana resource", async () => {
    const assetByChainAndContract = await findAssetBy({
      chain: Chain.Solana,
      contract: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });
    expect(assetByChainAndContract?.toUpperCase()).toBe(
      "SOL.USDC-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".toUpperCase(),
    );
  });

  test("find asset by Solana identifier", async () => {
    const assetByChainAndContract = await findAssetBy({
      identifier: "SOL.SOL",
    });
    expect(assetByChainAndContract?.toUpperCase()).toBe("SOL.SOL".toUpperCase());
  });
});
