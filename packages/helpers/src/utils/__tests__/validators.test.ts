import { describe, expect, test } from "bun:test";
import { validateIdentifier, validateTNS } from "../validators";

describe("validateTNS", () => {
  test("valid names with alphanumeric and allowed special chars", () => {
    expect(validateTNS("validname")).toBe(true);
    expect(validateTNS("valid-name")).toBe(true);
    expect(validateTNS("valid_name")).toBe(true);
    expect(validateTNS("valid+name")).toBe(true);
    expect(validateTNS("name123")).toBe(true);
    expect(validateTNS("UPPERCASE")).toBe(true);
    expect(validateTNS("MixedCase123")).toBe(true);
  });

  test("invalid names exceeding 30 characters", () => {
    expect(validateTNS("toolongname123456789012345678901")).toBe(false);
    expect(validateTNS("a".repeat(31))).toBe(false);
  });

  test("invalid names with disallowed characters", () => {
    expect(validateTNS("invalid@name")).toBe(false);
    expect(validateTNS("invalid!name")).toBe(false);
    expect(validateTNS("invalid#name")).toBe(false);
    expect(validateTNS("invalid$name")).toBe(false);
    expect(validateTNS("invalid%name")).toBe(false);
    expect(validateTNS("name with space")).toBe(false);
  });

  test("edge cases", () => {
    expect(validateTNS("a")).toBe(true);
    expect(validateTNS("a".repeat(30))).toBe(true);
    expect(validateTNS("")).toBe(false);
  });
});

describe("validateIdentifier", () => {
  test("valid chain.ticker format", () => {
    expect(validateIdentifier("BTC.BTC")).toBe(true);
    expect(validateIdentifier("ETH.ETH")).toBe(true);
    expect(validateIdentifier("AVAX.USDC-0x123")).toBe(true);
    expect(validateIdentifier("eth.eth")).toBe(true);
  });

  test("valid synth format with /", () => {
    expect(validateIdentifier("ETH/ETH")).toBe(true);
    expect(validateIdentifier("BTC/BTC")).toBe(true);
    expect(validateIdentifier("THOR.ETH/ETH")).toBe(true);
  });

  test("valid trade asset format with ~", () => {
    expect(validateIdentifier("THOR.ETH~ETH")).toBe(true);
    expect(validateIdentifier("THOR.BTC~BTC")).toBe(true);
    expect(validateIdentifier("THOR.ETH~USDC-0xa5f2211b9b8170f694421f2046281775e8468044")).toBe(true);
  });

  test("valid NEAR address formats", () => {
    expect(validateIdentifier("NEAR.wNEAR-wrap.near")).toBe(true);
    expect(validateIdentifier("NEAR.USDC-17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1")).toBe(true);
    expect(validateIdentifier("NEAR.ETH-eth.bridge.near")).toBe(true);
  });

  test("valid Maya synth format", () => {
    expect(validateIdentifier("MAYA.ETH/ETH")).toBe(true);
    expect(validateIdentifier("MAYA.BTC/BTC")).toBe(true);
  });

  test("throws for invalid chain", () => {
    expect(() => validateIdentifier("INVALID.TOKEN")).toThrow("helpers_invalid_identifier");
    expect(() => validateIdentifier("XXX.YYY")).toThrow("helpers_invalid_identifier");
  });

  test("throws for empty or malformed identifier", () => {
    expect(() => validateIdentifier("")).toThrow("helpers_invalid_identifier");
    expect(() => validateIdentifier("NOCHAIN")).toThrow("helpers_invalid_identifier");
  });

  test("accepts identifier with only chain (validates chain exists)", () => {
    // The validateIdentifier function only checks if the chain part is valid
    // It doesn't enforce the full <Chain>.<Ticker> format
    expect(validateIdentifier("ETH")).toBe(true);
    expect(validateIdentifier("ETH.")).toBe(true);
    expect(validateIdentifier("BTC")).toBe(true);
  });
});
