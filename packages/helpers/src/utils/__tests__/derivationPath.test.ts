import { describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/types";

import type { DerivationPathArray } from "../../types";
import {
  DerivationPath,
  derivationPathToString,
  getDerivationPathFor,
  getWalletFormatFor,
  updateDerivationPath,
} from "../derivationPath";

describe("derivationPathToString", () => {
  test("full 5-element path", () => {
    expect(derivationPathToString([44, 60, 0, 0, 0] as DerivationPathArray)).toBe("m/44'/60'/0'/0/0");
    expect(derivationPathToString([84, 0, 0, 0, 5] as DerivationPathArray)).toBe("m/84'/0'/0'/0/5");
  });

  test("4-element path without index", () => {
    expect(derivationPathToString([44, 60, 0, 0] as DerivationPathArray)).toBe("m/44'/60'/0'/0");
    expect(derivationPathToString([49, 2, 0, 1] as DerivationPathArray)).toBe("m/49'/2'/0'/1");
  });

  test("3-element account path", () => {
    expect(derivationPathToString([44, 60, 0] as unknown as DerivationPathArray)).toBe("m/44'/60'/0'");
    expect(derivationPathToString([44, 501, 5] as unknown as DerivationPathArray)).toBe("m/44'/501'/5'");
  });
});

describe("updateDerivationPath", () => {
  const basePath: DerivationPathArray = [44, 60, 0, 0, 0];

  test("updates index (last element)", () => {
    expect(updateDerivationPath(basePath, { index: 5 })).toEqual([44, 60, 0, 0, 5]);
    expect(updateDerivationPath(basePath, { index: 100 })).toEqual([44, 60, 0, 0, 100]);
  });

  test("updates change (4th element)", () => {
    expect(updateDerivationPath(basePath, { change: 1 })).toEqual([44, 60, 0, 1, 0]);
    expect(updateDerivationPath([84, 0, 2, 0, 3], { change: 1 })).toEqual([84, 0, 2, 1, 3]);
  });

  test("updates account (3rd element)", () => {
    expect(updateDerivationPath(basePath, { account: 5 })).toEqual([44, 60, 5, 0, 0]);
    expect(updateDerivationPath([84, 0, 0, 1, 10], { account: 3 })).toEqual([84, 0, 3, 1, 10]);
  });

  test("returns unchanged path for empty params", () => {
    expect(updateDerivationPath(basePath, {} as any)).toEqual(basePath);
  });
});

describe("getDerivationPathFor", () => {
  describe("EVM chains", () => {
    test("Ethereum default path", () => {
      expect(getDerivationPathFor({ chain: Chain.Ethereum, index: 0 })).toEqual([44, 60, 0, 0, 0]);
      expect(getDerivationPathFor({ chain: Chain.Ethereum, index: 5 })).toEqual([44, 60, 0, 0, 5]);
    });

    test("Ethereum legacy type", () => {
      expect(getDerivationPathFor({ chain: Chain.Ethereum, index: 3, type: "legacy" })).toEqual([44, 60, 0, 3]);
    });

    test("Ethereum account type", () => {
      expect(getDerivationPathFor({ chain: Chain.Ethereum, index: 2, type: "account" })).toEqual([44, 60, 0, 2]);
    });

    test("Ethereum ledgerLive type", () => {
      expect(getDerivationPathFor({ chain: Chain.Ethereum, index: 0, type: "ledgerLive" })).toEqual([44, 60, 0, 0, 0]);
      expect(getDerivationPathFor({ addressIndex: 1, chain: Chain.Ethereum, index: 2, type: "ledgerLive" })).toEqual([
        44, 60, 2, 0, 1,
      ]);
    });

    test("other EVM chains use same derivation", () => {
      expect(getDerivationPathFor({ chain: Chain.BinanceSmartChain, index: 0 })).toEqual([44, 60, 0, 0, 0]);
      expect(getDerivationPathFor({ chain: Chain.Avalanche, index: 0 })).toEqual([44, 60, 0, 0, 0]);
      expect(getDerivationPathFor({ chain: Chain.Arbitrum, index: 0 })).toEqual([44, 60, 0, 0, 0]);
    });
  });

  describe("Solana", () => {
    test("default path", () => {
      const result = getDerivationPathFor({ chain: Chain.Solana, index: 0 });
      expect(result[1]).toBe(501);
    });

    test("account type", () => {
      expect(getDerivationPathFor({ chain: Chain.Solana, index: 3, type: "account" })).toEqual([44, 501, 0, 3]);
    });
  });

  describe("UTXO chains", () => {
    test("Bitcoin nativeSegwitMiddleAccount", () => {
      expect(getDerivationPathFor({ chain: Chain.Bitcoin, index: 0, type: "nativeSegwitMiddleAccount" })).toEqual([
        84, 0, 0, 0, 0,
      ]);
      expect(
        getDerivationPathFor({ addressIndex: 5, chain: Chain.Bitcoin, index: 2, type: "nativeSegwitMiddleAccount" }),
      ).toEqual([84, 0, 2, 0, 5]);
    });

    test("Bitcoin segwit", () => {
      expect(getDerivationPathFor({ chain: Chain.Bitcoin, index: 3, type: "segwit" })).toEqual([49, 0, 0, 0, 3]);
    });

    test("Bitcoin legacy", () => {
      expect(getDerivationPathFor({ chain: Chain.Bitcoin, index: 0, type: "legacy" })).toEqual([44, 0, 0, 0, 0]);
      expect(getDerivationPathFor({ chain: Chain.Bitcoin, index: 5, type: "legacy" })).toEqual([44, 0, 0, 0, 5]);
    });

    test("Litecoin uses chainId 2", () => {
      expect(getDerivationPathFor({ chain: Chain.Litecoin, index: 0, type: "legacy" })).toEqual([44, 2, 0, 0, 0]);
      expect(getDerivationPathFor({ chain: Chain.Litecoin, index: 0, type: "segwit" })).toEqual([49, 2, 0, 0, 0]);
    });
  });
});

describe("getWalletFormatFor", () => {
  test("returns legacy for purpose 44", () => {
    expect(getWalletFormatFor("m/44'/0'/0'/0/0")).toBe("legacy");
    expect(getWalletFormatFor("m/44'/60'/0'/0/0")).toBe("legacy");
  });

  test("returns p2sh for purpose 49", () => {
    expect(getWalletFormatFor("m/49'/0'/0'/0/0")).toBe("p2sh");
    expect(getWalletFormatFor("m/49'/2'/0'/0/0")).toBe("p2sh");
  });

  test("returns bech32 for purpose 84 and others", () => {
    expect(getWalletFormatFor("m/84'/0'/0'/0/0")).toBe("bech32");
    expect(getWalletFormatFor("m/86'/0'/0'/0/0")).toBe("bech32");
  });
});

describe("DerivationPath export", () => {
  test("exports string paths for common chains", () => {
    expect(typeof DerivationPath[Chain.Ethereum]).toBe("string");
    expect(typeof DerivationPath[Chain.Bitcoin]).toBe("string");
    expect(DerivationPath[Chain.Ethereum]).toMatch(/^m\/\d+'\/\d+'\/\d+'/);
  });
});
