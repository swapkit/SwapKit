import { describe, expect, test } from "bun:test";
import { Chain, MemoType } from "../../types";

import {
  getMemoForDeposit,
  getMemoForLeaveAndBond,
  getMemoForNamePreferredAssetRegister,
  getMemoForNameRegister,
  getMemoForRunePoolDeposit,
  getMemoForRunePoolWithdraw,
  getMemoForSaverDeposit,
  getMemoForSaverWithdraw,
  getMemoForWithdraw,
} from "../memo";

describe("getMemoForSaverDeposit", () => {
  test("returns correct memo for single side", () => {
    const result = getMemoForSaverDeposit({ chain: Chain.Ethereum, symbol: "ETH" });
    expect(result).toBe("+:ETH/ETH");
  });
});

describe("getMemoForSaverWithdraw", () => {
  test("returns correct memo for single side", () => {
    const result = getMemoForSaverWithdraw({
      basisPoints: 5000,
      chain: Chain.Ethereum,
      symbol: "ETH",
    });
    expect(result).toBe("-:ETH/ETH:5000");
  });
});

describe("getMemoForLeaveAndBond", () => {
  test("returns correct memo for Leave", () => {
    const result = getMemoForLeaveAndBond({ address: "ABC123", type: MemoType.LEAVE });
    expect(result).toBe("LEAVE:ABC123");
  });

  test("returns correct memo for Bond", () => {
    const result = getMemoForLeaveAndBond({ address: "ABC123", type: MemoType.BOND });
    expect(result).toBe("BOND:ABC123");
  });
});

describe("getMemoForNameRegister", () => {
  test("returns correct memo for single side", () => {
    const result = getMemoForNameRegister({
      name: "asdfg",
      chain: Chain.Ethereum,
      owner: "thor1234",
      address: "0xaasd123",
    });
    expect(result).toBe("~:asdfg:ETH:0xaasd123:thor1234");
  });
});

describe("getMemoForNamePreferredAssetRegister", () => {
  test("returns correct memo for single side", () => {
    const result = getMemoForNamePreferredAssetRegister({
      name: "asdfg",
      chain: Chain.Ethereum,
      owner: "thor1234",
      asset: "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
      payout: "0x6621d872f17109d6601c49edba526ebcfd332d5d",
    });
    expect(result).toBe(
      "~:asdfg:ETH:0x6621d872f17109d6601c49edba526ebcfd332d5d:thor1234:ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
    );
  });
});

describe("getMemoForDeposit", () => {
  test("returns correct memo for single side", () => {
    const result = getMemoForDeposit({ chain: Chain.Ethereum, symbol: "ETH" });
    expect(result).toBe("+:ETH.ETH");
  });

  test("returns correct memo when paired address is not available but affiliate info is present", () => {
    const result = getMemoForDeposit({
      chain: Chain.Ethereum,
      symbol: "ETH",
      affiliateAddress: "thor1abc123",
      affiliateBasisPoints: 500,
    });
    expect(result).toBe("+:ETH.ETH::thor1abc123:500");
  });
});

describe("getMemoForWithdraw", () => {
  test("returns correct memo for single side", () => {
    const result = getMemoForWithdraw({
      chain: Chain.Ethereum,
      symbol: "ETH",
      ticker: "ETH",
      basisPoints: 100,
    });
    expect(result).toBe("-:ETH.ETH:100");
  });
});

describe("getMemoForRunePoolDeposit", () => {
  test("returns correct memo for single side", () => {
    const result = getMemoForRunePoolDeposit();
    expect(result).toBe("POOL+");
  });
});

describe("getMemoForRunePoolWithdraw", () => {
  test("returns correct memo for single side", () => {
    const result = getMemoForRunePoolWithdraw({ basisPoints: 500 });
    expect(result).toBe("POOL-:500");
  });

  test("returns correct memo when affiliate info is present", () => {
    const result = getMemoForRunePoolWithdraw({
      basisPoints: 500,
      affiliateAddress: "thor1abc123",
      affiliateBasisPoints: 500,
    });
    expect(result).toBe("POOL-:500:thor1abc123:500");
  });
});
