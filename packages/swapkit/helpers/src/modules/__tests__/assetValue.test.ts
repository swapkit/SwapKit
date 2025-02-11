import { describe, expect, test } from "bun:test";

import { BaseDecimal, Chain } from "../../types/chains";
import { AssetValue, getMinAmountByChain } from "../assetValue";

describe("AssetValue", () => {
  describe("assetValue", () => {
    test("returns asset ticker with value", () => {
      const fakeAvaxUSDCAsset = new AssetValue({
        decimal: 6,
        value: 1234567890,
        chain: Chain.Avalanche,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      });
      expect(fakeAvaxUSDCAsset.toString()).toBe(
        "AVAX.USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      );

      const ethSynth = new AssetValue({
        chain: Chain.THORChain,
        symbol: "ETH/ETH",
        decimal: 8,
        value: 1234567890,
      });

      expect(ethSynth.toString()).toBe("ETH/ETH");
      expect(ethSynth.mul(21.37).getValue("string")).toBe("26382715809.3");

      const ethTrade = new AssetValue({
        chain: Chain.THORChain,
        symbol: "ETH~ETH",
        decimal: 8,
        value: 1234567890,
      });

      expect(ethTrade.toString()).toBe("ETH~ETH");
      expect(ethTrade.mul(21.37).getValue("string")).toBe("26382715809.3");

      const ethThorTrade = new AssetValue({
        chain: Chain.THORChain,
        symbol: "ETH~THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
        decimal: 8,
        value: 1234567890,
      });

      expect(ethThorTrade.toString()).toBe("ETH~THOR-0xa5f2211b9b8170f694421f2046281775e8468044");
      expect(ethThorTrade.chain).toBe(Chain.THORChain);

      const ethThorSynth = new AssetValue({
        chain: Chain.THORChain,
        symbol: "ETH/THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
        decimal: 8,
        value: 1234567890,
      });
      expect(ethThorSynth.toString()).toBe("ETH/THOR-0xa5f2211b9b8170f694421f2046281775e8468044");
      expect(ethThorSynth.chain).toBe(Chain.THORChain);

      const mayaEthSynth = new AssetValue({
        chain: Chain.Maya,
        symbol: "ETH/ETH",
        decimal: 8,
        value: 1234567890,
      });
      expect(mayaEthSynth.toString()).toBe("ETH/ETH");
      expect(mayaEthSynth.chain).toBe(Chain.Maya);

      const mayaEthSynthFrom = AssetValue.from({
        asset: "MAYA.ETH/ETH",
        value: 12.3456789,
      });
      expect(mayaEthSynthFrom.toString()).toBe("ETH/ETH");
      expect(mayaEthSynthFrom.chain).toBe(Chain.Maya);

      const atomDerived = new AssetValue({
        identifier: "THOR.ATOM",
        decimal: 6,
        value: 123456789,
      });

      expect(atomDerived.toString()).toBe("THOR.ATOM");

      const mayaCacao = AssetValue.from({
        asset: "MAYA.CACAO",
        value: 10,
      });

      expect(mayaCacao.toString()).toBe("MAYA.CACAO");
      expect(mayaCacao.getBaseValue("string")).toBe("1000000000");

      const ethMayaSynth = AssetValue.from({
        asset: "MAYA.ETH/ETH",
        value: 10,
      });

      expect(ethMayaSynth.toString()).toBe("ETH/ETH");
      expect(ethMayaSynth.toString({ includeSynthProtocol: true })).toBe("MAYA.ETH/ETH");
      expect(ethMayaSynth.getBaseValue("string")).toBe("1000000000");

      const ethTCSynthFallback = AssetValue.from({
        asset: "ETH/ETH",
        value: 10,
      });

      expect(ethTCSynthFallback.toString()).toBe("ETH/ETH");
      expect(ethTCSynthFallback.toString({ includeSynthProtocol: true })).toBe("THOR.ETH/ETH");
      expect(ethTCSynthFallback.getBaseValue("string")).toBe("1000000000");

      // TODO:
      // const radixXWBTC = new AssetValue({
      //   identifier:
      //     "RADIX.XWBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
      //   decimal: 8,
      //   value: 11112222,
      // });

      // expect(radixXWBTC.toString()).toBe(
      //   "RADIX.XWBTC-resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75",
      // )
    });
  });

  describe("set", () => {
    test("get a copy of an assetValue with a new value", () => {
      const btc = AssetValue.from({
        asset: "BTC.BTC",
      });

      const btc2 = btc.set(10);

      expect(btc2).toBeDefined();
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
      const synthAvax = AssetValue.from({
        asset: "THOR.AVAX/AVAX",
        value: 1,
      });

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
        decimal: 6,
        value: 1234567890,
        chain: Chain.Avalanche,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      });
      expect(fakeAvaxUSDCAsset.toUrl()).toBe(
        "AVAX.USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      );

      const thor = AssetValue.from({ asset: "ETH.THOR" });
      expect(thor.toUrl()).toBe("ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044");

      const ethSynth = new AssetValue({
        chain: Chain.THORChain,
        symbol: "ETH/ETH",
        decimal: 8,
        value: 1234567890,
      });
      expect(ethSynth.toUrl()).toBe("THOR.ETH.ETH");

      const ethThorSynth = new AssetValue({
        chain: Chain.THORChain,
        symbol: "ETH/THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
        decimal: 8,
        value: 1234567890,
      });
      expect(ethThorSynth.toUrl()).toBe("THOR.ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044");

      const ethThorTrade = new AssetValue({
        chain: Chain.THORChain,
        symbol: "ETH~THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
        decimal: 8,
        value: 1234567890,
      });
      expect(ethThorTrade.toUrl()).toBe(
        "THOR.ETH..THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
      );
    });
  });

  describe("eq", () => {
    test("checks if assets are same chain and symbol", () => {
      const firstThor = AssetValue.from({ asset: "ETH.THOR" });
      const secondThor = AssetValue.from({ asset: "ETH.THOR" });
      const vThor = AssetValue.from({ asset: "ETH.vTHOR" });
      const firstUsdc = new AssetValue({
        chain: Chain.Avalanche,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
        decimal: 6,
        value: 1234567890,
      });
      const secondUsdc = new AssetValue({
        chain: Chain.Avalanche,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
        decimal: 6,
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
    test.todo("returns asset value with correct decimal", async () => {
      const avaxUSDCAsset = await AssetValue.from({
        asset: `${Chain.Avalanche}.USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e`,
        value: 1234567800n,
        asyncTokenLookup: true,
      });
      expect(avaxUSDCAsset.getValue("string")).toBe("1234.5678");
    });
  });

  describe("toString", () => {
    test("returns asset value string/identifier", async () => {
      const avaxUSDCAsset = new AssetValue({
        decimal: 6,
        value: 1234567890,
        chain: Chain.Avalanche,
        symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      });
      expect(avaxUSDCAsset.toString()).toBe("AVAX.USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e");

      const thor = AssetValue.from({ asset: "ETH.THOR" });
      expect(thor.toString()).toBe("ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044");

      const ethSynth = await AssetValue.from({ asset: "ETH/ETH", asyncTokenLookup: true });
      expect(ethSynth.toString()).toBe("ETH/ETH");
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
          address: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
          chain: Chain.Avalanche,
          decimal: 6,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
          ticker: "USDC",
        }),
      );
    });

    test("creates AssetValue from string with multiple dashes", async () => {
      const ethPendleLptAsset = await AssetValue.from({
        asset: "ETH.PENDLE-LPT-0x1234",
        asyncTokenLookup: true,
      });

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
      const fakeAvaxAsset = await AssetValue.from({
        asset: fakeAvaxAssetString,
        asyncTokenLookup: true,
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
    });

    test("creates AssetValue from string with multiple dashes", async () => {
      const fakeAvaxAssetString = "AVAX.ASDF-LP-1234";
      const fakeAvaxAsset = await AssetValue.from({
        asset: fakeAvaxAssetString,
        asyncTokenLookup: true,
      });

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
        value: 1,
        fromBaseDecimal: 8,
        asyncTokenLookup: true,
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
      expect(thor.toString()).toBe("ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044");
      expect(synthThor.toString()).toBe("ETH/THOR-0xa5f2211b9b8170f694421f2046281775e8468044");
      expect(synthDashes.toString()).toBe("ETH/PENDLE-LPT-0x1234");
    });
  });

  describe("fromIdentifierSync", () => {
    test("(same as fromIdentifier) - creates AssetValue from string via `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const thor = AssetValue.from({
        asset: "ARB.USDT-0XFD086BC7CD5C481DCC9C85EBE478A1C0B69FCBB9",
      });

      expect(thor).toBeDefined();
      expect(thor).toEqual(
        expect.objectContaining({
          address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
          chain: Chain.Arbitrum,
          decimal: 6,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDT-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
          ticker: "USDT",
        }),
      );
    });
  });

  describe("fromStringSync", () => {
    test("creates AssetValue from string via `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const thor = AssetValue.from({
        asset: "ETH.THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
      });

      expect(thor).toBeDefined();
      expect(thor).toEqual(
        expect.objectContaining({
          address: "0xa5f2211b9b8170f694421f2046281775e8468044",
          chain: Chain.Ethereum,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
          ticker: "THOR",
        }),
      );

      const usdc = AssetValue.from({
        asset: "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
      });
      expect(usdc).toBeDefined();
      expect(usdc).toEqual(
        expect.objectContaining({
          address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          chain: Chain.Ethereum,
          decimal: 6,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
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
          address: "0x152b9d0fdc40c096757f570a51e494bd4b943e50",
          chain: Chain.Avalanche,
          decimal: 8,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "BTC.b-0x152b9d0fdc40c096757f570a51e494bd4b943e50",
          ticker: "BTC.b",
        }),
      );
    });
  });

  describe("fromStringWithBaseSync", () => {
    test("creates AssetValue from string with base decimals via `@swapkit/tokens` lists", async () => {
      await AssetValue.loadStaticAssets();
      const btc = AssetValue.from({
        asset: "BTC.BTC",
        value: 5200000000000,
        fromBaseDecimal: 8,
      });

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
      const fakeAvaxUSDCAsset = AssetValue.from({
        asset: fakeAvaxUSDCAssetString,
        value: 1,
        fromBaseDecimal: 8,
      });

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
      const AvaxUSDC = AssetValue.from({
        asset: avaxUSDC,
        value: 100000000,
        fromBaseDecimal: 8,
      });

      expect(AvaxUSDC).toBeDefined();
      expect(AvaxUSDC).toEqual(
        expect.objectContaining({
          address: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
          chain: Chain.Avalanche,
          decimal: 6,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "USDC-0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
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
      expect(cosmosAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.Cosmos,
          decimal: BaseDecimal.GAIA,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "ATOM",
          ticker: "ATOM",
          type: "Native",
        }),
      );

      const bscAsset = AssetValue.from({ chain: Chain.BinanceSmartChain });
      expect(bscAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.BinanceSmartChain,
          decimal: BaseDecimal.BSC,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "BNB",
          ticker: "BNB",
          type: "Native",
        }),
      );

      const thorAsset = AssetValue.from({ chain: Chain.THORChain });
      expect(thorAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.THORChain,
          decimal: BaseDecimal.THOR,
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
          address: "0xa5f2211b9b8170f694421f2046281775e8468044",
          chain: Chain.Ethereum,
          decimal: 18,
          isGasAsset: false,
          isSynthetic: false,
          symbol: "THOR-0xa5f2211b9b8170f694421f2046281775e8468044",
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
      expect(arbAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.Arbitrum,
          decimal: BaseDecimal.ARB,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "ETH",
          ticker: "ETH",
          type: "Native",
        }),
      );

      const opAsset = AssetValue.from({ chain: Chain.Optimism });
      expect(opAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.Optimism,
          decimal: BaseDecimal.OP,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "ETH",
          ticker: "ETH",
          type: "Native",
        }),
      );

      const xrdAsset = AssetValue.from({ chain: Chain.Radix });
      expect(xrdAsset).toEqual(
        expect.objectContaining({
          address: undefined,
          chain: Chain.Radix,
          decimal: BaseDecimal.XRD,
          isGasAsset: true,
          isSynthetic: false,
          symbol: "XRD",
          ticker: "XRD",
          type: "Native",
        }),
      );
    });

    test("keep SOL address casing", () => {
      const solUsdc = AssetValue.from({
        asset: "SOL.USDC-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      });
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
