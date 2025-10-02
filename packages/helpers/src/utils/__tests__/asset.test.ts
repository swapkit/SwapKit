import { describe, expect, test } from "bun:test";
import { AllChains, Chain, getChainConfig } from "@swapkit/types";

import { assetFromString, fetchTokenInfo, getAssetType } from "../asset";

// TODO: this should be handled via AssetValue
const tickerMap: Record<string, string> = {
  [Chain.Arbitrum]: "ETH",
  [Chain.Aurora]: "ETH",
  [Chain.Base]: "ETH",
  [Chain.BinanceSmartChain]: "BNB",
  [Chain.Cosmos]: "ATOM",
  [Chain.Maya]: "CACAO",
  [Chain.Optimism]: "ETH",
  [Chain.THORChain]: "RUNE",
  [Chain.Tron]: "TRX",
};

describe("getAssetType", () => {
  describe("when isSynth is true", () => {
    test('should return "Synth"', () => {
      const result = getAssetType({ chain: Chain.Bitcoin, symbol: "BTC/BTC" });
      expect(result).toBe("Synth");
    });
  });

  describe("when isSynth is false", () => {
    describe("for gas assets on given chain", () => {
      for (const chain of AllChains) {
        test(`should return "Native" for chain ${chain} asset`, () => {
          const ticker = tickerMap[chain] || chain;
          const result = getAssetType({ chain: chain as Chain, symbol: ticker });

          expect(result).toBe("Native");
        });
      }
    });

    describe("for non-gas assets on given chain", () => {
      for (const chain of AllChains) {
        test(`should return ${chain} for chain ${chain} asset`, () => {
          const result = getAssetType({ chain: chain as Chain, symbol: "USDT" });

          expect(result).toBe(chain);
        });
      }
    });
  });
});

describe("fetchTokenInfo", () => {
  /**
   * Test out native
   */
  const filteredChains = AllChains.filter((c) => ![Chain.Ethereum, Chain.Avalanche].includes(c));

  for (const chain of filteredChains) {
    describe(chain, () => {
      test(`returns proper decimal for native ${chain} asset`, async () => {
        const { decimals } = await fetchTokenInfo({ address: "", chain });
        const { baseDecimal } = getChainConfig(chain);
        expect(decimals).toBe(baseDecimal);
      });
    });
  }

  describe("ETH", () => {
    // TODO: if too many requests, this will fail due to timeout
    test.todo("returns proper decimal for eth and it's assets", async () => {
      const { decimals: ethDecimal } = await fetchTokenInfo({ address: "", chain: Chain.Ethereum });
      expect(ethDecimal).toBe(getChainConfig(Chain.Ethereum).baseDecimal);
      await Bun.sleep(500);

      const { decimals: usdcDecimal } = await fetchTokenInfo({
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        chain: Chain.Ethereum,
      });
      expect(usdcDecimal).toBe(6);
      await Bun.sleep(500);

      const { decimals: wbtcDecimal } = await fetchTokenInfo({
        address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        chain: Chain.Ethereum,
      });
      expect(wbtcDecimal).toBe(8);
      await Bun.sleep(500);

      const { decimals: kindDecimal } = await fetchTokenInfo({
        address: "0x4618519de4c304f3444ffa7f812dddc2971cc688",
        chain: Chain.Ethereum,
      });
      expect(kindDecimal).toBe(8);
      await Bun.sleep(500);

      const { decimals: shitcoinDecimal } = await fetchTokenInfo({
        address: "0xCa208BfD69ae6D2667f1FCbE681BAe12767c0078",
        chain: Chain.Ethereum,
      });
      expect(shitcoinDecimal).toBe(0);
      await Bun.sleep(500);
    });
  });

  describe("AVAX", () => {
    // TODO: if too many requests, this will fail due to timeout
    test.todo("returns proper decimal for avax and it's assets", async () => {
      const { decimals: avaxDecimal } = await fetchTokenInfo({ address: "", chain: Chain.Avalanche });
      expect(avaxDecimal).toBe(getChainConfig(Chain.Avalanche).baseDecimal);

      const { decimals: wbtceDecimal } = await fetchTokenInfo({
        address: "0x50b7545627a5162f82a992c33b87adc75187b218",
        chain: Chain.Avalanche,
      });
      expect(wbtceDecimal).toBe(8);

      const { decimals: btcbDecimal } = await fetchTokenInfo({
        address: "0x152b9d0FdC40C096757F570A51E494bd4b943E50",
        chain: Chain.Avalanche,
      });
      expect(btcbDecimal).toBe(8);

      const { decimals: timeDecimal } = await fetchTokenInfo({
        address: "0xb54f16fB19478766A268F172C9480f8da1a7c9C3",
        chain: Chain.Avalanche,
      });
      expect(timeDecimal).toBe(9);

      const { decimals: usdtDecimal } = await fetchTokenInfo({
        address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
        chain: Chain.Avalanche,
      });
      expect(usdtDecimal).toBe(6);

      const { decimals: usdcDecimal } = await fetchTokenInfo({
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        chain: Chain.Avalanche,
      });
      expect(usdcDecimal).toBe(6);
    });
  });

  describe("Radix", () => {
    test.todo("returns proper decimal for radix and it's assets", async () => {
      const { decimals: radixDecimal } = await fetchTokenInfo({ address: "", chain: Chain.Radix });
      expect(radixDecimal).toBe(getChainConfig(Chain.Radix).baseDecimal);
      await Bun.sleep(500);

      const { decimals: xwBTCDecimal } = await fetchTokenInfo({
        address: "xwBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
        chain: Chain.Radix,
      });
      expect(xwBTCDecimal).toBe(8);
      await Bun.sleep(500);
    });
  });
});

describe("assetFromString", () => {
  test("should return the correct object", () => {
    const assetString = "THOR.RUNE";
    const result = assetFromString(assetString);

    expect(result).toEqual({ chain: Chain.THORChain, symbol: "RUNE", synth: false, ticker: "RUNE" });
  });

  test("should return the correct object for multiple dashes", () => {
    const assetString = "ETH.PENDLE-LPT-0x1234";
    const result = assetFromString(assetString);

    expect(result).toEqual({ chain: Chain.Ethereum, symbol: "PENDLE-LPT-0x1234", synth: false, ticker: "PENDLE-LPT" });
  });

  test.todo("should return the correct object for Radix resource", () => {
    const assetString = "XRD.xwBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75";
    const result = assetFromString(assetString);

    expect(result).toEqual({
      chain: Chain.Radix,
      symbol: "xwBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
      synth: false,
      ticker: "xwBTC",
    });
  });
});
