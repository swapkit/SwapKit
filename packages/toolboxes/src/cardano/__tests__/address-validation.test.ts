import { beforeAll, describe, expect, test } from "bun:test";
import { getCardanoAddressValidator } from "../toolbox";

const context: { validateAddress: Awaited<ReturnType<typeof getCardanoAddressValidator>> } = {} as any;

beforeAll(async () => {
  context.validateAddress = await getCardanoAddressValidator();
});

describe("Cardano Address Validation", () => {
  test("should validate valid Cardano addresses", () => {
    const validAddresses = [
      "addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs68faae",
    ];

    for (const address of validAddresses) {
      expect(context.validateAddress(address)).toBe(true);
    }
  });

  test("should reject invalid Cardano addresses", () => {
    const invalidAddresses = [
      "",
      "invalid",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "addr1",
      "stake1",
    ];

    for (const address of invalidAddresses) {
      expect(context.validateAddress(address)).toBe(false);
    }
  });

  test("should handle edge cases", () => {
    const edgeCases = [null, undefined, 123, {}, [], true, false];

    for (const testCase of edgeCases) {
      expect(context.validateAddress(testCase as any)).toBe(false);
    }
  });
});
