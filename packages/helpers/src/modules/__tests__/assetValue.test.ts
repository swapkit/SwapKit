import { describe, expect, test } from "bun:test";

import { Chain, getChainConfig } from "@swapkit/types";
import { AssetValue, getMinAmountByChain } from "../assetValue";

describe("AssetValue", () => {
  describe("assetValue", () => {
    test("returns asset ticker with value", () => {
      const fakeAvaxUSDCAsset = new AssetValue({
        chain: Chain.Avalanche,
        decimal: 6,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
        value: 1234567890,
      });
      expect(fakeAvaxUSDCAsset.toString()).toBe("AVAX.USDC-0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E");

      const ethSynth = new AssetValue({ chain: Chain.THORChain, decimal: 8, symbol: "ETH/ETH", value: 1234567890 });

      expect(ethSynth.toString()).toBe("ETH/ETH");
      expect(ethSynth.mul(21.37).getValue("string")).toBe("26382715809.3");

      const ethTrade = new AssetValue({ chain: Chain.THORChain, decimal: 8, symbol: "ETH~ETH", value: 1234567890 });

      expect(ethTrade.toString()).toBe("ETH~ETH");
      expect(ethTrade.mul(21.37).getValue("string")).toBe("26382715809.3");

      const ethThorTrade = new AssetValue({
        chain: Chain.THORChain,
        decimal: 8,
        symbol: "ETH~THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
        value: 1234567890,
      });

      expect(ethThorTrade.toString()).toBe("ETH~THOR-0xa5f2211b9b8170f694421f2046281775e8468044");
      expect(ethThorTrade.chain).toBe(Chain.THORChain);

      const ethThorSynth = new AssetValue({
        chain: Chain.THORChain,
        decimal: 8,
        symbol: "ETH/THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
        value: 1234567890,
      });
      expect(ethThorSynth.toString()).toBe("ETH/THOR-0xa5f2211b9b8170f694421f2046281775e8468044");
      expect(ethThorSynth.chain).toBe(Chain.THORChain);

      const mayaEthSynth = new AssetValue({ chain: Chain.Maya, decimal: 8, symbol: "ETH/ETH", value: 1234567890 });
      expect(mayaEthSynth.toString()).toBe("ETH/ETH");
      expect(mayaEthSynth.chain).toBe(Chain.Maya);

      const mayaEthSynthFrom = AssetValue.from({ asset: "MAYA.ETH/ETH", value: 12.3456789 });
      expect(mayaEthSynthFrom.toString()).toBe("ETH/ETH");
      expect(mayaEthSynthFrom.chain).toBe(Chain.Maya);

      const atomDerived = new AssetValue({ decimal: 6, identifier: "THOR.ATOM", value: 123456789 });

      expect(atomDerived.toString()).toBe("THOR.ATOM");

      const value = 10;
      const mayaCacao = AssetValue.from({ asset: "MAYA.CACAO", value });

      expect(mayaCacao.toString()).toBe("MAYA.CACAO");
      const expectedValue = value * 10_000_000_000;
      expect(mayaCacao.getBaseValue("string")).toBe(expectedValue.toString());

      const ethMayaSynth = AssetValue.from({ asset: "MAYA.ETH/ETH", value: 10 });

      expect(ethMayaSynth.toString()).toBe("ETH/ETH");
      expect(ethMayaSynth.toString({ includeSynthProtocol: true })).toBe("MAYA.ETH/ETH");
      expect(ethMayaSynth.getBaseValue("string")).toBe("1000000000");

      const ethTCSynthFallback = AssetValue.from({ asset: "ETH/ETH", value: 10 });

      expect(ethTCSynthFallback.toString()).toBe("ETH/ETH");
      expect(ethTCSynthFallback.toString({ includeSynthProtocol: true })).toBe("THOR.ETH/ETH");
      expect(ethTCSynthFallback.getBaseValue("string")).toBe("1000000000");

      const solFromString = AssetValue.from({ asset: "SOL.SOL" });
      expect(solFromString.toString()).toBe("SOL.SOL");
    });

    test("regres cases", () => {
      const arbWeth = AssetValue.from({ asset: "ARB.WETH-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" });
      expect(arbWeth.toString()).toBe("ARB.WETH-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1");

      const baseAssetFromString = AssetValue.from({ asset: "BASE.USDC-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" });
      expect(baseAssetFromString.toString()).toBe("BASE.USDC-0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");

      const avaxSolanaAsset = AssetValue.from({ asset: "AVAX.SOL-0XFE6B19286885A4F7F55ADAD09C3CD1F906D2478F" });
      expect(avaxSolanaAsset.toString()).toBe("AVAX.SOL-0xFE6B19286885a4F7F55AdAD09C3Cd1f906D2478F");
    });

    test("NEAR assets creation", () => {
      // Standard NEAR token formats
      const wNear = AssetValue.from({ asset: "NEAR.wNEAR-wrap.near" });
      expect(wNear.toString()).toBe("NEAR.wNEAR-wrap.near");
      expect(wNear.chain).toBe(Chain.Near);
      expect(wNear.symbol).toBe("wNEAR-wrap.near");
      expect(wNear.ticker).toBe("wNEAR");
      expect(wNear.address).toBe("wrap.near");

      const ethBridge = AssetValue.from({ asset: "NEAR.ETH-eth.bridge.near" });
      expect(ethBridge.toString()).toBe("NEAR.ETH-eth.bridge.near");
      expect(ethBridge.chain).toBe(Chain.Near);
      expect(ethBridge.symbol).toBe("ETH-eth.bridge.near");
      expect(ethBridge.ticker).toBe("ETH");
      expect(ethBridge.address).toBe("eth.bridge.near");

      // Token with hash identifier
      const usdc = AssetValue.from({
        asset: "NEAR.USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
      });
      expect(usdc.toString()).toBe("NEAR.USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1");
      expect(usdc.chain).toBe(Chain.Near);
      expect(usdc.symbol).toBe("USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1");
      expect(usdc.ticker).toBe("USDC");
      expect(usdc.address).toBe("17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1");

      // Tether token format
      const usdt = AssetValue.from({ asset: "NEAR.USDT-usdt.tether-token.near" });
      expect(usdt.toString()).toBe("NEAR.USDT-usdt.tether-token.near");
      expect(usdt.chain).toBe(Chain.Near);
      expect(usdt.symbol).toBe("USDT-usdt.tether-token.near");
      expect(usdt.ticker).toBe("USDT");
      expect(usdt.address).toBe("usdt.tether-token.near");

      // Factory bridge format
      const frax = AssetValue.from({ asset: "NEAR.FRAX-853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near" });
      expect(frax.toString()).toBe("NEAR.FRAX-853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near");
      expect(frax.chain).toBe(Chain.Near);
      expect(frax.symbol).toBe("FRAX-853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near");
      expect(frax.ticker).toBe("FRAX");
      expect(frax.address).toBe("853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near");

      const aurora = AssetValue.from({
        asset: "NEAR.AURORA-aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near",
      });
      expect(aurora.toString()).toBe("NEAR.AURORA-aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near");
      expect(aurora.chain).toBe(Chain.Near);
      expect(aurora.symbol).toBe("AURORA-aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near");
      expect(aurora.ticker).toBe("AURORA");
      expect(aurora.address).toBe("aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near");

      const wBTC = AssetValue.from({ asset: "NEAR.wBTC-2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near" });
      expect(wBTC.toString()).toBe("NEAR.wBTC-2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near");
      expect(wBTC.chain).toBe(Chain.Near);
      expect(wBTC.symbol).toBe("wBTC-2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near");
      expect(wBTC.ticker).toBe("wBTC");
      expect(wBTC.address).toBe("2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near");

      // Custom token formats
      const blackdragon = AssetValue.from({ asset: "NEAR.BLACKDRAGON-blackdragon.tkn.near" });
      expect(blackdragon.toString()).toBe("NEAR.BLACKDRAGON-blackdragon.tkn.near");
      expect(blackdragon.chain).toBe(Chain.Near);
      expect(blackdragon.symbol).toBe("BLACKDRAGON-blackdragon.tkn.near");
      expect(blackdragon.ticker).toBe("BLACKDRAGON");
      expect(blackdragon.address).toBe("blackdragon.tkn.near");

      const shitzu = AssetValue.from({ asset: "NEAR.SHITZU-token.0xshitzu.near" });
      expect(shitzu.toString()).toBe("NEAR.SHITZU-token.0xshitzu.near");
      expect(shitzu.chain).toBe(Chain.Near);
      expect(shitzu.symbol).toBe("SHITZU-token.0xshitzu.near");
      expect(shitzu.ticker).toBe("SHITZU");
      expect(shitzu.address).toBe("token.0xshitzu.near");

      // Meme-cooking format
      const abg = AssetValue.from({ asset: "NEAR.ABG-abg-966.meme-cooking.near" });
      expect(abg.toString()).toBe("NEAR.ABG-abg-966.meme-cooking.near");
      expect(abg.chain).toBe(Chain.Near);
      expect(abg.symbol).toBe("ABG-abg-966.meme-cooking.near");
      expect(abg.ticker).toBe("ABG");
      expect(abg.address).toBe("abg-966.meme-cooking.near");

      const noear = AssetValue.from({ asset: "NEAR.NOEAR-noear-324.meme-cooking.near" });
      expect(noear.toString()).toBe("NEAR.NOEAR-noear-324.meme-cooking.near");
      expect(noear.chain).toBe(Chain.Near);
      expect(noear.symbol).toBe("NOEAR-noear-324.meme-cooking.near");
      expect(noear.ticker).toBe("NOEAR");
      expect(noear.address).toBe("noear-324.meme-cooking.near");

      const jambo = AssetValue.from({ asset: "NEAR.JAMBO-jambo-1679.meme-cooking.near" });
      expect(jambo.toString()).toBe("NEAR.JAMBO-jambo-1679.meme-cooking.near");
      expect(jambo.chain).toBe(Chain.Near);
      expect(jambo.symbol).toBe("JAMBO-jambo-1679.meme-cooking.near");
      expect(jambo.ticker).toBe("JAMBO");
      expect(jambo.address).toBe("jambo-1679.meme-cooking.near");

      const gnear = AssetValue.from({ asset: "NEAR.GNEAR-gnear-229.meme-cooking.near" });
      expect(gnear.toString()).toBe("NEAR.GNEAR-gnear-229.meme-cooking.near");
      expect(gnear.chain).toBe(Chain.Near);
      expect(gnear.symbol).toBe("GNEAR-gnear-229.meme-cooking.near");
      expect(gnear.ticker).toBe("GNEAR");
      expect(gnear.address).toBe("gnear-229.meme-cooking.near");

      const purge = AssetValue.from({ asset: "NEAR.PURGE-purge-558.meme-cooking.near" });
      expect(purge.toString()).toBe("NEAR.PURGE-purge-558.meme-cooking.near");
      expect(purge.chain).toBe(Chain.Near);
      expect(purge.symbol).toBe("PURGE-purge-558.meme-cooking.near");
      expect(purge.ticker).toBe("PURGE");
      expect(purge.address).toBe("purge-558.meme-cooking.near");

      // Various token formats
      const mpDAO = AssetValue.from({ asset: "NEAR.mpDAO-mpdao-token.near" });
      expect(mpDAO.toString()).toBe("NEAR.mpDAO-mpdao-token.near");
      expect(mpDAO.chain).toBe(Chain.Near);
      expect(mpDAO.symbol).toBe("mpDAO-mpdao-token.near");
      expect(mpDAO.ticker).toBe("mpDAO");
      expect(mpDAO.address).toBe("mpdao-token.near");

      const nearKat = AssetValue.from({ asset: "NEAR.NearKat-kat.token0.near" });
      expect(nearKat.toString()).toBe("NEAR.NearKat-kat.token0.near");
      expect(nearKat.chain).toBe(Chain.Near);
      expect(nearKat.symbol).toBe("NearKat-kat.token0.near");
      expect(nearKat.ticker).toBe("NearKat");
      expect(nearKat.address).toBe("kat.token0.near");

      const testNebula = AssetValue.from({ asset: "NEAR.TESTNEBULA-test-token.highdome3013.near" });
      expect(testNebula.toString()).toBe("NEAR.TESTNEBULA-test-token.highdome3013.near");
      expect(testNebula.chain).toBe(Chain.Near);
      expect(testNebula.symbol).toBe("TESTNEBULA-test-token.highdome3013.near");
      expect(testNebula.ticker).toBe("TESTNEBULA");
      expect(testNebula.address).toBe("test-token.highdome3013.near");

      const sweat = AssetValue.from({ asset: "NEAR.SWEAT-token.sweat" });
      expect(sweat.toString()).toBe("NEAR.SWEAT-token.sweat");
      expect(sweat.chain).toBe(Chain.Near);
      expect(sweat.symbol).toBe("SWEAT-token.sweat");
      expect(sweat.ticker).toBe("SWEAT");
      expect(sweat.address).toBe("token.sweat");

      const rhea = AssetValue.from({ asset: "NEAR.RHEA-token.rhealab.near" });
      expect(rhea.toString()).toBe("NEAR.RHEA-token.rhealab.near");
      expect(rhea.chain).toBe(Chain.Near);
      expect(rhea.symbol).toBe("RHEA-token.rhealab.near");
      expect(rhea.ticker).toBe("RHEA");
      expect(rhea.address).toBe("token.rhealab.near");

      const publicToken = AssetValue.from({ asset: "NEAR.PUBLIC-token.publicailab.near" });
      expect(publicToken.toString()).toBe("NEAR.PUBLIC-token.publicailab.near");
      expect(publicToken.chain).toBe(Chain.Near);
      expect(publicToken.symbol).toBe("PUBLIC-token.publicailab.near");
      expect(publicToken.ticker).toBe("PUBLIC");
      expect(publicToken.address).toBe("token.publicailab.near");

      const hapi = AssetValue.from({ asset: "NEAR.HAPI-d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near" });
      expect(hapi.toString()).toBe("NEAR.HAPI-d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near");
      expect(hapi.chain).toBe(Chain.Near);
      expect(hapi.symbol).toBe("HAPI-d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near");
      expect(hapi.ticker).toBe("HAPI");
      expect(hapi.address).toBe("d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near");

      const btc = AssetValue.from({ asset: "NEAR.BTC-nbtc.bridge.near" });
      expect(btc.toString()).toBe("NEAR.BTC-nbtc.bridge.near");
      expect(btc.chain).toBe(Chain.Near);
      expect(btc.symbol).toBe("BTC-nbtc.bridge.near");
      expect(btc.ticker).toBe("BTC");
      expect(btc.address).toBe("nbtc.bridge.near");

      const turbo = AssetValue.from({
        asset: "NEAR.TURBO-a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near",
      });
      expect(turbo.toString()).toBe("NEAR.TURBO-a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near");
      expect(turbo.chain).toBe(Chain.Near);
      expect(turbo.symbol).toBe("TURBO-a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near");
      expect(turbo.ticker).toBe("TURBO");
      expect(turbo.address).toBe("a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near");

      // Native NEAR
      const near = AssetValue.from({ asset: "NEAR.NEAR" });
      expect(near.toString()).toBe("NEAR.NEAR");
      expect(near.chain).toBe(Chain.Near);
      expect(near.symbol).toBe("NEAR");
      expect(near.ticker).toBe("NEAR");
      expect(near.address).toBeUndefined();
    });

    test("NEAR assets with values", () => {
      const wNearWithValue = AssetValue.from({ asset: "NEAR.wNEAR-wrap.near", value: 10.5 });
      expect(wNearWithValue.toString()).toBe("NEAR.wNEAR-wrap.near");
      expect(wNearWithValue.getValue("string")).toBe("10.5");
      expect(wNearWithValue.chain).toBe(Chain.Near);

      const usdcWithValue = AssetValue.from({
        asset: "NEAR.USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
        value: 1000.123456,
      });
      expect(usdcWithValue.toString()).toBe(
        "NEAR.USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
      );
      expect(usdcWithValue.getValue("string")).toBe("1000.123456");
      expect(usdcWithValue.chain).toBe(Chain.Near);

      const nearWithValue = AssetValue.from({ asset: "NEAR.NEAR", value: 0.000001 });
      expect(nearWithValue.toString()).toBe("NEAR.NEAR");
      expect(nearWithValue.getValue("string")).toBe("0.000001");
      expect(nearWithValue.chain).toBe(Chain.Near);
    });
  });

  describe("set", () => {
    test("get a copy of an assetValue with a new value", () => {
      const btc = AssetValue.from({ asset: "BTC.BTC" });

      const btc2 = btc.set(10);

      expect(btc2).toEqual(
        expect.objectContaining({
          chain: Chain.Bitcoin,
          decimal: 8,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "BTC",
          ticker: "BTC",
        }),
      );

      expect(btc.getValue("string")).toBe("0");
      expect(btc2.getValue("string")).toBe("10");
    });

    test("get a copy of a synth assetValue with a new value", () => {
      const synthAvax = AssetValue.from({ asset: "THOR.AVAX/AVAX", value: 1 });

      const synthAvax2 = synthAvax.set(10);

      expect(synthAvax2).toBeDefined();
      expect(synthAvax2).toEqual(
        expect.objectContaining({
          chain: Chain.THORChain,
          decimal: 8,
          isGasAsset: false,
          isSynthetic: true,
          symbol: "AVAX/AVAX",
          ticker: "AVAX",
        }),
      );

      expect(synthAvax.getValue("string")).toBe("1");
      expect(synthAvax2.getValue("string")).toBe("10");
      expect(synthAvax.toString({ includeSynthProtocol: true })).toBe("THOR.AVAX/AVAX");
      expect(synthAvax2.toString({ includeSynthProtocol: true })).toBe("THOR.AVAX/AVAX");
    });
  });

  describe("toUrl", () => {
    test("returns asset compliance with url", () => {
      const fakeAvaxUSDCAsset = new AssetValue({
        chain: Chain.Avalanche,
        decimal: 6,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
        value: 1234567890,
      });
      expect(fakeAvaxUSDCAsset.toUrl()).toBe("AVAX.USDC-0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E");

      const thor = AssetValue.from({ asset: "ETH.THOR" });
      expect(thor.toUrl()).toBe("ETH.THOR-0xa5f2211B9b8170F694421f2046281775E8468044");

      const ethSynth = new AssetValue({ chain: Chain.THORChain, decimal: 8, symbol: "ETH/ETH", value: 1234567890 });
      expect(ethSynth.toUrl()).toBe("THOR.ETH.ETH");

      const ethThorSynth = new AssetValue({
        chain: Chain.THORChain,
        decimal: 8,
        symbol: "ETH/THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
        value: 1234567890,
      });
      expect(ethThorSynth.toUrl()).toBe("THOR.ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044");

      const ethThorTrade = new AssetValue({
        chain: Chain.THORChain,
        decimal: 8,
        symbol: "ETH~THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
        value: 1234567890,
      });
      expect(ethThorTrade.toUrl()).toBe("THOR.ETH..THOR-0xa5f2211b9b8170f694421f2046281775e8468044");
    });
  });

  describe("eq", () => {
    test("checks if assets are same chain and symbol", () => {
      const firstThor = AssetValue.from({ asset: "ETH.THOR" });
      const secondThor = AssetValue.from({ asset: "ETH.THOR" });
      const vThor = AssetValue.from({ asset: "ETH.vTHOR" });
      const firstUsdc = new AssetValue({
        chain: Chain.Avalanche,
        decimal: 6,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
        value: 1234567890,
      });
      const secondUsdc = new AssetValue({
        chain: Chain.Avalanche,
        decimal: 6,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
        value: 1234,
      });

      expect(firstThor.eqAsset(firstThor)).toBe(true);
      expect(firstThor.eqAsset(secondThor)).toBe(true);
      expect(firstThor.eqAsset(vThor)).toBe(false);
      expect(firstThor.eqAsset(firstUsdc)).toBe(false);
      expect(firstThor.eqAsset(secondUsdc)).toBe(false);

      expect(firstUsdc.eqAsset(firstThor)).toBe(false);
      expect(firstUsdc.eqAsset(secondThor)).toBe(false);
      expect(firstUsdc.eqAsset(vThor)).toBe(false);
      expect(firstUsdc.eqAsset(firstUsdc)).toBe(true);
      expect(firstUsdc.eqAsset(secondUsdc)).toBe(true);
    });

    test("check if assets have same value, even if not same asset", () => {
      const firstThor = AssetValue.from({ asset: "ETH.THOR", value: "20" });
      const secondThor = AssetValue.from({ asset: "ETH.THOR", value: "35" });
      const thirdThor = AssetValue.from({ asset: "ETH.THOR", value: "35" });
      const vThor = AssetValue.from({ asset: "ETH.vTHOR", value: "20" });

      expect(firstThor.eqValue(firstThor)).toBe(true);
      expect(firstThor.eqValue(secondThor)).toBe(false);
      expect(secondThor.eqValue(thirdThor)).toBe(true);
      expect(firstThor.eqValue(vThor)).toBe(true);
    });

    test("check if assets have identical asset and value", () => {
      const firstThor = AssetValue.from({ asset: "ETH.THOR", value: "20" });
      const secondThor = AssetValue.from({ asset: "ETH.THOR", value: "35" });
      const thirdThor = AssetValue.from({ asset: "ETH.THOR", value: "35" });
      const vThor = AssetValue.from({ asset: "ETH.vTHOR", value: "20" });

      expect(firstThor.eq(firstThor)).toBe(true);
      expect(firstThor.eq(secondThor)).toBe(false);
      expect(secondThor.eq(thirdThor)).toBe(true);
      expect(firstThor.eq(vThor)).toBe(false);
    });
  });

  describe("from bigint", () => {
    test("returns asset value with correct decimal", async () => {
      const avaxUSDCAsset = await AssetValue.from({
        asset: `${Chain.Avalanche}.USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e`,
        asyncTokenLookup: true,
        value: 1234567800n,
      });
      expect(avaxUSDCAsset.getValue("string")).toBe("1234.5678");
    });
  });

  describe("toString", () => {
    test("returns asset value string/identifier", async () => {
      const avaxUSDCAsset = new AssetValue({
        chain: Chain.Avalanche,
        decimal: 6,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
        value: 1234567890,
      });
      expect(avaxUSDCAsset.toString()).toBe("AVAX.USDC-0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E");

      const thor = AssetValue.from({ asset: "ETH.THOR" });
      expect(thor.toString()).toBe("ETH.THOR-0xa5f2211B9b8170F694421f2046281775E8468044");

      const ethSynth = await AssetValue.from({ asset: "ETH/ETH", asyncTokenLookup: true });
      expect(ethSynth.toString()).toBe("ETH/ETH");

      const eth = await AssetValue.from({ asset: "eth.eth" });
      expect(eth.toString()).toBe("ETH.ETH");

      const ethFromChain = await AssetValue.from({ chain: Chain.Ethereum });
      expect(ethFromChain.toString()).toBe("ETH.ETH");
    });
  });

  describe("fromIdentifier", () => {
    test("creates AssetValue from string", async () => {
      const avaxUSDCAsset = await AssetValue.from({
        asset: "AVAX.USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
        asyncTokenLookup: true,
      });

      expect(avaxUSDCAsset).toEqual(
        expect.objectContaining({
          address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
          chain: Chain.Avalanche,
          decimal: 6,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
          ticker: "USDC",
        }),
      );
    });

    test("creates AssetValue from string with multiple dashes", async () => {
      const ethPendleLptAsset = await AssetValue.from({ asset: "ETH.PENDLE-LPT-0x1234", asyncTokenLookup: true });

      expect(ethPendleLptAsset).toEqual(
        expect.objectContaining({
          address: "0x1234",
          chain: Chain.Ethereum,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "PENDLE-LPT-0x1234",
          ticker: "PENDLE-LPT",
        }),
      );
    });
  });

  describe("fromString", () => {
    test("creates AssetValue from string", async () => {
      const fakeAvaxAssetString = "AVAX.ASDF-1234";
      const fakeAvaxAsset = await AssetValue.from({ asset: fakeAvaxAssetString, asyncTokenLookup: true });

      expect(fakeAvaxAsset).toEqual(
        expect.objectContaining({
          address: "1234",
          chain: Chain.Avalanche,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "ASDF-1234",
          ticker: "ASDF",
        }),
      );
    });

    test("creates AssetValue from string with multiple dashes", async () => {
      const fakeAvaxAssetString = "AVAX.ASDF-LP-1234";
      const fakeAvaxAsset = await AssetValue.from({ asset: fakeAvaxAssetString, asyncTokenLookup: true });

      expect(fakeAvaxAsset).toEqual(
        expect.objectContaining({
          address: "1234",
          chain: Chain.Avalanche,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "ASDF-LP-1234",
          ticker: "ASDF-LP",
        }),
      );
    });

    test.todo("creates AssetValue with _ symbol", async () => {
      const radixXWBTC = await AssetValue.from({
        asset: "XRD.XWBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
        asyncTokenLookup: true,
      });

      expect(radixXWBTC).toEqual(
        expect.objectContaining({
          address: "resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
          chain: Chain.Radix,
          decimal: 8,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "XWBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
          ticker: "XWBTC",
        }),
      );
    });
  });

  describe("fromStringWithBase", () => {
    test("creates AssetValue from string with base", async () => {
      const fakeAvaxAssetString = "AVAX.ASDF-1234";
      const fakeAvaxAsset = await AssetValue.from({
        asset: fakeAvaxAssetString,
        asyncTokenLookup: true,
        fromBaseDecimal: 8,
        value: 1,
      });

      expect(fakeAvaxAsset).toEqual(
        expect.objectContaining({
          address: "1234",
          chain: Chain.Avalanche,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "ASDF-1234",
          ticker: "ASDF",
        }),
      );
      expect(fakeAvaxAsset.getValue("string")).toBe("0.00000001");
      expect(fakeAvaxAsset.getBaseValue("string")).toBe("10000000000");
    });
  });

  describe("fromUrl", () => {
    test("creates AssetValue from url like format", () => {
      const synthETHString = "THOR.ETH.ETH";
      const ethString = "ETH.ETH";
      const thorString = "ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044";
      const synthThorString = "THOR.ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044";
      const synthDashesString = "THOR.ETH.PENDLE-LPT-0x1234";

      const synthETH = AssetValue.fromUrl(synthETHString);
      const eth = AssetValue.fromUrl(ethString);
      const thor = AssetValue.fromUrl(thorString);
      const synthThor = AssetValue.fromUrl(synthThorString);
      const synthDashes = AssetValue.fromUrl(synthDashesString);

      expect(synthETH.toString()).toBe("ETH/ETH");
      expect(eth.toString()).toBe("ETH.ETH");
      expect(thor.toString()).toBe("ETH.THOR-0xa5f2211B9b8170F694421f2046281775E8468044");
      expect(synthThor.toString()).toBe("ETH/THOR-0xa5f2211b9b8170f694421f2046281775e8468044");
      expect(synthDashes.toString()).toBe("ETH/PENDLE-LPT-0x1234");
    });

    test("fromUrl and toUrl roundtrip for all chains", () => {
      // Native gas assets
      const testCases = [
        // EVM chains
        { asset: "ETH.ETH", url: "ETH.ETH" },
        { asset: "AVAX.AVAX", url: "AVAX.AVAX" },
        { asset: "BSC.BNB", url: "BSC.BNB" },
        { asset: "ARB.ETH", url: "ARB.ETH" },
        { asset: "OP.ETH", url: "OP.ETH" },
        { asset: "POL.POL", url: "POL.POL" },
        { asset: "BASE.ETH", url: "BASE.ETH" },
        { asset: "GNO.XDAI", url: "GNO.XDAI" }, // Gnosis uses XDAI in URLs
        { asset: "AURORA.ETH", url: "AURORA.ETH" },
        { asset: "BERA.BERA", url: "BERA.BERA" },

        // UTXO chains
        { asset: "BTC.BTC", url: "BTC.BTC" },
        { asset: "BCH.BCH", url: "BCH.BCH" },
        { asset: "LTC.LTC", url: "LTC.LTC" },
        { asset: "DOGE.DOGE", url: "DOGE.DOGE" },
        { asset: "DASH.DASH", url: "DASH.DASH" },
        { asset: "ZEC.ZEC", url: "ZEC.ZEC" },

        // Cosmos chains
        { asset: "THOR.RUNE", url: "THOR.RUNE" },
        { asset: "MAYA.CACAO", url: "MAYA.CACAO" },
        { asset: "GAIA.ATOM", url: "GAIA.ATOM" },
        { asset: "KUJI.KUJI", url: "KUJI.KUJI" },
        { asset: "NOBLE.USDC", url: "NOBLE.USDC" },

        // Other chains
        { asset: "SOL.SOL", url: "SOL.SOL" },
        { asset: "TRON.TRX", url: "TRON.TRX" },
        { asset: "XRD.XRD", url: "XRD.XRD" },
        { asset: "XRP.XRP", url: "XRP.XRP" },
        { asset: "DOT.DOT", url: "DOT.DOT" },
        { asset: "FLIP.FLIP", url: "FLIP.FLIP" },
        { asset: "NEAR.NEAR", url: "NEAR.NEAR" },

        // Tokens with addresses
        {
          asset: "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          url: "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
        {
          asset: "BSC.USDT-0x55d398326f99059fF775485246999027B3197955",
          url: "BSC.USDT-0x55d398326f99059fF775485246999027B3197955",
        },
        {
          asset: "AVAX.USDC.e-0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
          url: "AVAX.USDC__e-0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
        },
        {
          asset: "ARB.WETH-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
          url: "ARB.WETH-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        },
        {
          asset: "POL.USDC-0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
          url: "POL.USDC-0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        },
        {
          asset: "BASE.USDC-0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          url: "BASE.USDC-0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        },

        // Near tokens - dots are encoded as __
        { asset: "NEAR.wNEAR-wrap.near", url: "NEAR.wNEAR-wrap__near" },
        { asset: "NEAR.ETH-eth.bridge.near", url: "NEAR.ETH-eth__bridge__near" },
        { asset: "NEAR.USDT-usdt.tether-token.near", url: "NEAR.USDT-usdt__tether-token__near" },
        { asset: "NEAR.BLACKDRAGON-blackdragon.tkn.near", url: "NEAR.BLACKDRAGON-blackdragon__tkn__near" },
        { asset: "NEAR.SHITZU-token.0xshitzu.near", url: "NEAR.SHITZU-token__0xshitzu__near" },
        { asset: "NEAR.BTC-nbtc.bridge.near", url: "NEAR.BTC-nbtc__bridge__near" },
        {
          asset: "NEAR.AURORA-aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near",
          url: "NEAR.AURORA-aaaaaa20d9e0e2461697782ef11675f668207961__factory__bridge__near",
        },
        {
          asset: "NEAR.FRAX-853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near",
          url: "NEAR.FRAX-853d955acef822db058eb8505911ed77f175b99e__factory__bridge__near",
        },
        {
          asset: "NEAR.wBTC-2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near",
          url: "NEAR.wBTC-2260fac5e5542a773aa44fbcfedf7c193bc2c599__factory__bridge__near",
        },
        {
          asset: "NEAR.HAPI-d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near",
          url: "NEAR.HAPI-d9c2d319cd7e6177336b0a9c93c21cb48d84fb54__factory__bridge__near",
        },
        { asset: "NEAR.PURGE-purge-558.meme-cooking.near", url: "NEAR.PURGE-purge-558__meme-cooking__near" },
        { asset: "NEAR.ABG-abg-966.meme-cooking.near", url: "NEAR.ABG-abg-966__meme-cooking__near" },
        { asset: "NEAR.NOEAR-noear-324.meme-cooking.near", url: "NEAR.NOEAR-noear-324__meme-cooking__near" },
        { asset: "NEAR.JAMBO-jambo-1679.meme-cooking.near", url: "NEAR.JAMBO-jambo-1679__meme-cooking__near" },
        { asset: "NEAR.GNEAR-gnear-229.meme-cooking.near", url: "NEAR.GNEAR-gnear-229__meme-cooking__near" },
        { asset: "NEAR.mpDAO-mpdao-token.near", url: "NEAR.mpDAO-mpdao-token__near" },
        { asset: "NEAR.NearKat-kat.token0.near", url: "NEAR.NearKat-kat__token0__near" },
        {
          asset: "NEAR.TESTNEBULA-test-token.highdome3013.near",
          url: "NEAR.TESTNEBULA-test-token__highdome3013__near",
        },
        { asset: "NEAR.RHEA-token.rhealab.near", url: "NEAR.RHEA-token__rhealab__near" },
        { asset: "NEAR.PUBLIC-token.publicailab.near", url: "NEAR.PUBLIC-token__publicailab__near" },
        { asset: "NEAR.SWEAT-token.sweat", url: "NEAR.SWEAT-token__sweat" },
        {
          asset: "NEAR.USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
          url: "NEAR.USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
        },

        // THORChain Synths - THOR prefix for chain, then chain.symbol
        { asset: "THOR.ETH/ETH", url: "THOR.ETH.ETH" },
        { asset: "THOR.BTC/BTC", url: "THOR.BTC.BTC" },
        { asset: "THOR.AVAX/AVAX", url: "THOR.AVAX.AVAX" },
        { asset: "THOR.BSC/BNB", url: "THOR.BSC.BNB" },
        { asset: "THOR.GAIA/ATOM", url: "THOR.GAIA.ATOM" },

        // THORChain Trade assets - THOR prefix, then chain..symbol (double dot)
        { asset: "THOR.ETH~ETH", url: "THOR.ETH..ETH" },
        { asset: "THOR.BTC~BTC", url: "THOR.BTC..BTC" },
        { asset: "THOR.AVAX~AVAX", url: "THOR.AVAX..AVAX" },

        // Maya synths - MAYA prefix for chain, then chain.symbol
        { asset: "MAYA.ETH/ETH", url: "MAYA.ETH.ETH" },
        { asset: "MAYA.BTC/BTC", url: "MAYA.BTC.BTC" },

        // Synths with tokens
        {
          asset: "MAYA.ETH/USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          url: "MAYA.ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
        {
          asset: "THOR.BSC/USDT-0x55d398326f99059fF775485246999027B3197955",
          url: "THOR.BSC.USDT-0x55d398326f99059fF775485246999027B3197955",
        },

        // Trade assets with tokens
        {
          asset: "THOR.ETH~USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          url: "THOR.ETH..USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
        {
          asset: "THOR.BSC~USDT-0x55d398326f99059fF775485246999027B3197955",
          url: "THOR.BSC..USDT-0x55d398326f99059fF775485246999027B3197955",
        },
      ];

      for (const { asset, url } of testCases) {
        const assetValue = AssetValue.from({ asset });
        expect(assetValue.toUrl()).toBe(url);

        const fromUrl = AssetValue.fromUrl(url);
        // Synths and trade assets need special handling with includeSynthProtocol
        if ((asset.startsWith("MAYA.") || asset.startsWith("THOR.")) && (asset.includes("/") || asset.includes("~"))) {
          expect(fromUrl.toString({ includeSynthProtocol: true })).toBe(asset);
        } else {
          expect(fromUrl.toString()).toBe(asset);
        }
      }
    });

    test("handles complex token symbols in URLs", () => {
      // Tokens with multiple dashes in symbol
      const pendle = AssetValue.from({ asset: "ETH.PENDLE-LPT-0x1234567890abcdef" });
      expect(pendle.toUrl()).toBe("ETH.PENDLE-LPT-0x1234567890abcdef");
      expect(pendle.ticker).toBe("PENDLE-LPT");
      expect(pendle.address).toBe("0x1234567890abcdef");

      const fromUrlPendle = AssetValue.fromUrl("ETH.PENDLE-LPT-0x1234567890abcdef");
      expect(fromUrlPendle.toString()).toBe("ETH.PENDLE-LPT-0x1234567890abcdef");
      expect(fromUrlPendle.ticker).toBe("PENDLE-LPT");
      expect(fromUrlPendle.address).toBe("0x1234567890abcdef");

      // Synth with complex symbol
      const synthPendle = AssetValue.from({ asset: "THOR.ETH/PENDLE-LPT-0x1234567890abcdef" });
      expect(synthPendle.toUrl()).toBe("THOR.ETH.PENDLE-LPT-0x1234567890abcdef");

      const fromUrlSynthPendle = AssetValue.fromUrl("THOR.ETH.PENDLE-LPT-0x1234567890abcdef");
      expect(fromUrlSynthPendle.toString({ includeSynthProtocol: true })).toBe(
        "THOR.ETH/PENDLE-LPT-0x1234567890abcdef",
      );
      expect(fromUrlSynthPendle.ticker).toBe("PENDLE-LPT");
      expect(fromUrlSynthPendle.address).toBe("0x1234567890abcdef");

      // Trade asset with complex symbol
      const tradePendle = AssetValue.from({ asset: "THOR.ETH~PENDLE-LPT-0x1234567890abcdef" });
      expect(tradePendle.toUrl()).toBe("THOR.ETH..PENDLE-LPT-0x1234567890abcdef");

      const fromUrlTradePendle = AssetValue.fromUrl("THOR.ETH..PENDLE-LPT-0x1234567890abcdef");
      expect(fromUrlTradePendle.toString({ includeSynthProtocol: true })).toBe(
        "THOR.ETH~PENDLE-LPT-0x1234567890abcdef",
      );
      expect(fromUrlTradePendle.ticker).toBe("PENDLE-LPT");
      expect(fromUrlTradePendle.address).toBe("0x1234567890abcdef");
    });

    test("handles special chain cases in URLs", () => {
      // Gnosis chain special case (GNO -> XDAI)
      const gnosis = AssetValue.from({ asset: "GNO.XDAI" });
      expect(gnosis.toUrl()).toBe("GNO.XDAI");

      const fromUrlGnosis = AssetValue.fromUrl("GNO.XDAI");
      expect(fromUrlGnosis.toString()).toBe("GNO.XDAI");
      expect(fromUrlGnosis.ticker).toBe("XDAI");
      expect(fromUrlGnosis.isGasAsset).toBe(true);

      // Tron TRX
      const tron = AssetValue.from({ asset: "TRON.TRX" });
      expect(tron.toUrl()).toBe("TRON.TRX");

      const fromUrlTron = AssetValue.fromUrl("TRON.TRX");
      expect(fromUrlTron.toString()).toBe("TRON.TRX");
      expect(fromUrlTron.ticker).toBe("TRX");
      expect(fromUrlTron.isGasAsset).toBe(true);
    });
  });

  describe("fromIdentifierSync", () => {
    test("(same as fromIdentifier) - creates AssetValue from string via `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const thor = AssetValue.from({ asset: "ARB.USDT-0XFD086BC7CD5C481DCC9C85EBE478A1C0B69FCBB9" });

      expect(thor).toBeDefined();
      expect(thor).toEqual(
        expect.objectContaining({
          address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          chain: Chain.Arbitrum,
          decimal: 6,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDT-0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          ticker: "USDT",
        }),
      );
    });
  });

  describe("fromStringSync", () => {
    test("creates AssetValue from string via `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const thor = AssetValue.from({ asset: "ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044" });

      expect(thor).toBeDefined();
      expect(thor).toEqual(
        expect.objectContaining({
          address: "0xa5f2211B9b8170F694421f2046281775E8468044",
          chain: Chain.Ethereum,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "THOR-0xa5f2211B9b8170F694421f2046281775E8468044",
          ticker: "THOR",
        }),
      );

      const usdc = AssetValue.from({ asset: "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48" });
      expect(usdc).toBeDefined();
      expect(usdc).toEqual(
        expect.objectContaining({
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          chain: Chain.Ethereum,
          decimal: 6,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          ticker: "USDC",
        }),
      );
    });

    test("returns safe decimals if string is not in `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const fakeAvaxUSDCAssetString = "AVAX.USDC-1234";
      const fakeAvaxUSDCAsset = AssetValue.from({ asset: fakeAvaxUSDCAssetString });

      expect(fakeAvaxUSDCAsset).toBeDefined();
      expect(fakeAvaxUSDCAsset).toEqual(
        expect.objectContaining({
          address: "1234",
          chain: Chain.Avalanche,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-1234",
          ticker: "USDC",
        }),
      );
    });

    test("returns safe decimals if string is not in `@swapkit/tokens` lists with multiple dashes", async () => {
      await AssetValue.loadStaticAssets();
      const fakeAvaxUSDCAssetString = "AVAX.USDC-LPT-1234";
      const fakeAvaxUSDCAsset2 = AssetValue.from({ asset: fakeAvaxUSDCAssetString });

      expect(fakeAvaxUSDCAsset2).toBeDefined();
      expect(fakeAvaxUSDCAsset2).toEqual(
        expect.objectContaining({
          address: "1234",
          chain: Chain.Avalanche,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-LPT-1234",
          ticker: "USDC-LPT",
        }),
      );
    });

    test("returns proper avax string with address from `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const avaxBTCb = "AVAX.BTC.b-0x152b9d0fdc40c096757f570a51e494bd4b943e50";
      const AvaxBTCb = AssetValue.from({ asset: avaxBTCb });

      expect(AvaxBTCb).toBeDefined();
      expect(AvaxBTCb).toEqual(
        expect.objectContaining({
          address: "0x152b9d0FdC40C096757F570A51E494bd4b943E50",
          chain: Chain.Avalanche,
          decimal: 8,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "BTC.B-0x152b9d0FdC40C096757F570A51E494bd4b943E50",
          ticker: "BTC.B",
        }),
      );
    });
  });

  describe("fromStringWithBaseSync", () => {
    test("creates AssetValue from string with base decimals via `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const btc = AssetValue.from({ asset: "BTC.BTC", fromBaseDecimal: 8, value: 5200000000000 });

      expect(btc).toBeDefined();
      expect(btc).toEqual(
        expect.objectContaining({
          chain: Chain.Bitcoin,
          decimal: 8,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "BTC",
          ticker: "BTC",
        }),
      );

      expect(btc.getValue("string")).toBe("52000");
      expect(btc.getBaseValue("string")).toBe("5200000000000");
    });

    test("returns safe decimals if string is not in `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const fakeAvaxUSDCAssetString = "AVAX.USDC-1234";
      const fakeAvaxUSDCAsset = AssetValue.from({ asset: fakeAvaxUSDCAssetString, fromBaseDecimal: 8, value: 1 });

      expect(fakeAvaxUSDCAsset).toBeDefined();
      expect(fakeAvaxUSDCAsset).toEqual(
        expect.objectContaining({
          address: "1234",
          chain: Chain.Avalanche,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-1234",
          ticker: "USDC",
        }),
      );

      expect(fakeAvaxUSDCAsset.getValue("string")).toBe("0.00000001");
      expect(fakeAvaxUSDCAsset.getBaseValue("string")).toBe("10000000000");
    });

    test("returns proper avax string with address from `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const avaxUSDC = "AVAX.USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e";
      const AvaxUSDC = AssetValue.from({ asset: avaxUSDC, fromBaseDecimal: 8, value: 100000000 });

      expect(AvaxUSDC).toBeDefined();
      expect(AvaxUSDC).toEqual(
        expect.objectContaining({
          address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
          chain: Chain.Avalanche,
          decimal: 6,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
          ticker: "USDC",
        }),
      );

      expect(AvaxUSDC.getValue("string")).toBe("1");
      expect(AvaxUSDC.getBaseValue("string")).toBe("1000000");
    });
  });

  describe("fromChainOrSignature", () => {
    test("creates AssetValue from common asset string or chain", () => {
      const cosmosAsset = AssetValue.from({ chain: Chain.Cosmos });
      const { baseDecimal: gaiaDecimal } = getChainConfig(Chain.Cosmos);
      expect(cosmosAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.Cosmos,
          decimal: gaiaDecimal,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "ATOM",
          ticker: "ATOM",
          type: "Native",
        }),
      );

      const bscAsset = AssetValue.from({ chain: Chain.BinanceSmartChain });
      const { baseDecimal: bscDecimal } = getChainConfig(Chain.BinanceSmartChain);
      expect(bscAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.BinanceSmartChain,
          decimal: bscDecimal,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "BNB",
          ticker: "BNB",
          type: "Native",
        }),
      );

      const thorAsset = AssetValue.from({ chain: Chain.THORChain });
      const { baseDecimal: thorDecimal } = getChainConfig(Chain.THORChain);
      expect(thorAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.THORChain,
          decimal: thorDecimal,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "RUNE",
          ticker: "RUNE",
          type: "Native",
        }),
      );

      const cacaoAsset = AssetValue.from({ chain: Chain.Maya });
      expect(cacaoAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.Maya,
          decimal: 10,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "CACAO",
          ticker: "CACAO",
          type: "Native",
        }),
      );

      const thor = AssetValue.from({ asset: "ETH.THOR" });
      expect(thor).toEqual(
        expect.objectContaining({
          address: "0xa5f2211B9b8170F694421f2046281775E8468044",
          chain: Chain.Ethereum,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "THOR-0xa5f2211B9b8170F694421f2046281775E8468044",
          ticker: "THOR",
        }),
      );

      // FIXME: just some casing? is it safe to change
      // const vthor = AssetValue.from({ asset: "ETH.vTHOR" });
      // expect(vthor).toEqual(
      //   expect.objectContaining({
      //     address: "0x815c23eca83261b6ec689b60cc4a58b54bc24d8d",
      //     chain: Chain.Ethereum,
      //     decimal: 18,
      //     isGasAsset: false,
      //     isSynthetic: false,
      //     symbol: "vTHOR-0x815c23eca83261b6ec689b60cc4a58b54bc24d8d",
      //     ticker: "vTHOR",
      //   }),
      // );

      const arbAsset = AssetValue.from({ chain: Chain.Arbitrum });
      const { baseDecimal: arbDecimal } = getChainConfig(Chain.Arbitrum);
      expect(arbAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.Arbitrum,
          decimal: arbDecimal,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "ETH",
          ticker: "ETH",
          type: "Native",
        }),
      );

      const opAsset = AssetValue.from({ chain: Chain.Optimism });
      const { baseDecimal: opDecimal } = getChainConfig(Chain.Optimism);
      expect(opAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.Optimism,
          decimal: opDecimal,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "ETH",
          ticker: "ETH",
          type: "Native",
        }),
      );

      const xrdAsset = AssetValue.from({ chain: Chain.Radix });
      const { baseDecimal: xrdDecimal } = getChainConfig(Chain.Radix);
      expect(xrdAsset).toEqual(
        expect.objectContaining({
          chain: Chain.Radix,
          decimal: xrdDecimal,
          isGasAsset: true,
          isSynthetic: false,
          ticker: "XRD",
          type: "Native",
        }),
      );

      const trxAsset = AssetValue.from({ chain: Chain.Tron });
      const { baseDecimal: trxDecimal } = getChainConfig(Chain.Tron);
      expect(trxAsset).toEqual(
        expect.objectContaining({
          chain: Chain.Tron,
          decimal: trxDecimal,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "TRX",
          ticker: "TRX",
          type: "Native",
        }),
      );

      const trxAssetFromString = AssetValue.from({ asset: "TRON.TRX" });
      const { baseDecimal: trxDecimalFromString } = getChainConfig(Chain.Tron);
      expect(trxAssetFromString).toEqual(
        expect.objectContaining({
          chain: Chain.Tron,
          decimal: trxDecimalFromString,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "TRX",
          ticker: "TRX",
          type: "Native",
        }),
      );
    });

    test("keep SOL address casing", () => {
      const solUsdc = AssetValue.from({ asset: "SOL.USDC-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" });
      expect(solUsdc).toEqual(
        expect.objectContaining({
          address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          chain: Chain.Solana,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          ticker: "USDC",
        }),
      );
    });

    test("TRC20 tokens are not marked as gas assets", () => {
      const tronUsdt = AssetValue.from({ asset: "TRON.USDT-TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" });

      expect(tronUsdt).toEqual(
        expect.objectContaining({
          address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          chain: Chain.Tron,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDT-TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          ticker: "USDT",
        }),
      );
    });
  });
});

describe("getMinAmountByChain", () => {
  test("returns min amount for chain", () => {
    expect(getMinAmountByChain(Chain.THORChain).getValue("string")).toBe("0");
    expect(getMinAmountByChain(Chain.Maya).getValue("string")).toBe("0");
    expect(getMinAmountByChain(Chain.Cosmos).getValue("string")).toBe("0.000001");

    expect(getMinAmountByChain(Chain.Bitcoin).getValue("string")).toBe("0.00010001");
    expect(getMinAmountByChain(Chain.Litecoin).getValue("string")).toBe("0.00010001");
    expect(getMinAmountByChain(Chain.BitcoinCash).getValue("string")).toBe("0.00010001");
    expect(getMinAmountByChain(Chain.Dogecoin).getValue("string")).toBe("1.00000001");

    expect(getMinAmountByChain(Chain.BinanceSmartChain).getValue("string")).toBe("0.00000001");
    expect(getMinAmountByChain(Chain.Ethereum).getValue("string")).toBe("0.00000001");
    expect(getMinAmountByChain(Chain.Avalanche).getValue("string")).toBe("0.00000001");
    expect(getMinAmountByChain(Chain.Arbitrum).getValue("string")).toBe("0.00000001");
    expect(getMinAmountByChain(Chain.Optimism).getValue("string")).toBe("0.00000001");
  });
});

describe("asyncTokenLookup", () => {
  describe("EVM chains with asyncTokenLookup", () => {
    test("fetches Ethereum USDC token info with chain and address only", async () => {
      const assetValue = await AssetValue.from({
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        asyncTokenLookup: true,
        chain: Chain.Ethereum,
        value: 1000,
      });

      expect(assetValue.decimal).toBe(6); // USDC has 6 decimals
      expect(assetValue.symbol).toContain("USDC");
      expect(assetValue.getValue("string")).toBe("1000");
    });

    test("fetches Ethereum WETH token info with asset string and asyncTokenLookup", async () => {
      const assetValue = await AssetValue.from({
        asset: "ETH.WETH-0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        asyncTokenLookup: true,
        value: 0.5,
      });

      expect(assetValue.decimal).toBe(18);
      expect(assetValue.symbol).toBe("WETH-0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
      expect(assetValue.ticker).toBe("WETH");
      expect(assetValue.getValue("string")).toBe("0.5");
    });

    test("fetches Avalanche USDC.e with chain and address", async () => {
      const assetValue = await AssetValue.from({
        address: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
        asyncTokenLookup: true,
        chain: Chain.Avalanche,
        value: 100,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.symbol).toContain("USDC");
      expect(assetValue.getValue("string")).toBe("100");
    });

    test("fetches BSC BUSD with full asset string", async () => {
      const assetValue = await AssetValue.from({
        asset: "BSC.BUSD-0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
        asyncTokenLookup: true,
        value: 50.25,
      });

      expect(assetValue.decimal).toBe(18);
      expect(assetValue.symbol).toBe("BUSD-0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56");
      expect(assetValue.ticker).toBe("BUSD");
      expect(assetValue.getValue("string")).toBe("50.25");
    });

    test("fetches Arbitrum USDC native with chain and address", async () => {
      const assetValue = await AssetValue.from({
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        asyncTokenLookup: true,
        chain: Chain.Arbitrum,
        fromBaseDecimal: 6,
        value: 1000000,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.getBaseValue("string")).toBe("1000000");
      expect(assetValue.getValue("string")).toBe("1");
      expect(assetValue.toString()).toBe("ARB.USDC-0xaf88d065e77c8cC2239327C5EDb3A432268e5831");
    });
  });

  describe("Solana with asyncTokenLookup", () => {
    test("fetches Solana USDC with chain and address", async () => {
      const assetValue = await AssetValue.from({
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        asyncTokenLookup: true,
        chain: Chain.Solana,
        value: 250.75,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.symbol).toContain("USDC");
      expect(assetValue.getValue("string")).toBe("250.75");
    });

    test("fetches Solana token with asset string", async () => {
      const assetValue = await AssetValue.from({
        asset: "SOL.USDT-Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        asyncTokenLookup: true,
        value: 100,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.symbol).toBe("USDT-Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
      expect(assetValue.ticker).toBe("USDT");
    });
  });

  describe("Tron with asyncTokenLookup", () => {
    test("fetches Tron USDT with chain and address", async () => {
      const assetValue = await AssetValue.from({
        address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        asyncTokenLookup: true,
        chain: Chain.Tron,
        value: 500,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.symbol).toContain("USDT");
      expect(assetValue.getValue("string")).toBe("500");
    });

    test("fetches Tron token with asset string", async () => {
      const assetValue = await AssetValue.from({
        asset: "TRON.USDC-TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
        asyncTokenLookup: true,
        value: 1234.56,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.symbol).toBe("USDC-TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8");
      expect(assetValue.getValue("string")).toBe("1234.56");
    });
  });

  describe("Near with asyncTokenLookup", () => {
    test("fetches Near wNEAR with chain and address", async () => {
      const assetValue = await AssetValue.from({
        address: "wrap.near",
        asyncTokenLookup: true,
        chain: Chain.Near,
        value: 10,
      });

      expect(assetValue.decimal).toBe(24);
      expect(assetValue.symbol).toContain("wNEAR");
      expect(assetValue.getValue("string")).toBe("10");
    });

    test("fetches Near USDC with asset string", async () => {
      const assetValue = await AssetValue.from({
        asset: "NEAR.USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
        asyncTokenLookup: true,
        value: 999.99,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.symbol).toBe("USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1");
      expect(assetValue.ticker).toBe("USDC");
      expect(assetValue.getValue("string")).toBe("999.99");
    });

    test("fetches Near token with .near address format", async () => {
      const assetValue = await AssetValue.from({
        address: "usdt.tether-token.near",
        asyncTokenLookup: true,
        chain: Chain.Near,
        value: 2500,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.toString()).toBe("NEAR.USDT-usdt.tether-token.near");
      expect(assetValue.getValue("string")).toBe("2500");
    });
  });

  describe("Edge cases and caching", () => {
    test("handles invalid token address gracefully", async () => {
      const assetValue = await AssetValue.from({
        address: "0xinvalidaddress",
        asyncTokenLookup: true,
        chain: Chain.Ethereum,
        value: 10,
      });

      expect(assetValue.decimal).toBe(18);
      expect(assetValue.getValue("string")).toBe("10");
    });

    test("works with fromBaseDecimal parameter", async () => {
      const assetValue = await AssetValue.from({
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        asyncTokenLookup: true,
        chain: Chain.Ethereum,
        fromBaseDecimal: 6,
        value: 1000000,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.getBaseValue("string")).toBe("1000000");
      expect(assetValue.getValue("string")).toBe("1");
    });

    test("synchronous call without asyncTokenLookup", async () => {
      await AssetValue.loadStaticAssets();

      const assetValue = AssetValue.from({
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        chain: Chain.Ethereum,
        value: 100,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.getValue("string")).toBe("100");
      expect(assetValue.symbol).toBe("USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

      const assetValueWrongAddress = AssetValue.from({ address: "0xVERYWRONG", chain: Chain.Ethereum, value: 100 });

      expect(assetValueWrongAddress.decimal).toBe(18);
      expect(assetValueWrongAddress.getValue("string")).toBe("100");
      expect(assetValueWrongAddress.toString()).toBe("ETH.UNKNOWN-0xverywrong");
    });

    test("handles Radix with symbol lookup", async () => {
      const assetValue = await AssetValue.from({
        asyncTokenLookup: true,
        chain: Chain.Radix,
        symbol: "XRD",
        value: 50,
      });

      expect(assetValue.decimal).toBe(18);
      expect(assetValue.symbol).toBe("XRD");
      expect(assetValue.getValue("string")).toBe("50");
    });
  });

  describe("Mixed symbol and address scenarios", () => {
    test("uses on-chain data when both symbol and address provided", async () => {
      const assetValue = await AssetValue.from({
        asset: "ETH.WRONG-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        asyncTokenLookup: true,
        value: 100,
      });

      expect(assetValue.decimal).toBe(6);
      expect(assetValue.symbol).toContain("USDC");
      expect(assetValue.address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    });
  });
});
