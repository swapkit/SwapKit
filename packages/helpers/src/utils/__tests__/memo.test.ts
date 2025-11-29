import { describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/types";
import { MemoType } from "../../types";

import {
  getMemoForDeposit,
  getMemoForLeaveAndBond,
  getMemoForNamePreferredAssetRegister,
  getMemoForNameRegister,
  getMemoForRunePoolDeposit,
  getMemoForRunePoolWithdraw,
  getMemoForWithdraw,
} from "../memo";

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
  test("returns correct memo for name registration", () => {
    const result = getMemoForNameRegister({
      address: "0xaasd123",
      chain: Chain.Ethereum,
      name: "asdfg",
      owner: "thor1234",
    });
    expect(result).toBe("~:asdfg:ETH:0xaasd123:thor1234");
  });
});

describe("getMemoForNamePreferredAssetRegister", () => {
  test("returns correct memo for preferred asset registration", () => {
    const result = getMemoForNamePreferredAssetRegister({
      asset: "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
      chain: Chain.Ethereum,
      name: "asdfg",
      owner: "thor1234",
      payout: "0x6621d872f17109d6601c49edba526ebcfd332d5d",
    });
    expect(result).toBe(
      "~:asdfg:ETH:0x6621d872f17109d6601c49edba526ebcfd332d5d:thor1234:ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48",
    );
  });
});

describe("getMemoForDeposit", () => {
  test("returns correct memo for deposit", () => {
    const result = getMemoForDeposit({ chain: Chain.Ethereum, symbol: "ETH" });
    expect(result).toBe("+:ETH.ETH");
  });

  test("returns correct memo when paired address is not available but affiliate info is present", () => {
    const result = getMemoForDeposit({
      affiliateAddress: "thor1abc123",
      affiliateBasisPoints: 500,
      chain: Chain.Ethereum,
      symbol: "ETH",
    });
    expect(result).toBe("+:ETH.ETH::thor1abc123:500");
  });
});

describe("getMemoForWithdraw", () => {
  test("returns correct memo for withdraw", () => {
    const result = getMemoForWithdraw({ basisPoints: 100, chain: Chain.Ethereum, symbol: "ETH", ticker: "ETH" });
    expect(result).toBe("-:ETH.ETH:100");
  });
});

describe("getMemoForRunePoolDeposit", () => {
  test("returns correct memo for rune pool deposit", () => {
    const result = getMemoForRunePoolDeposit();
    expect(result).toBe("POOL+");
  });
});

describe("getMemoForRunePoolWithdraw", () => {
  test("returns correct memo for rune pool withdraw", () => {
    const result = getMemoForRunePoolWithdraw({ basisPoints: 500 });
    expect(result).toBe("POOL-:500");
  });

  test("returns correct memo when affiliate info is present", () => {
    const result = getMemoForRunePoolWithdraw({
      affiliateAddress: "thor1abc123",
      affiliateBasisPoints: 500,
      basisPoints: 500,
    });
    expect(result).toBe("POOL-:500:thor1abc123:500");
  });
});
