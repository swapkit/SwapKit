import { beforeAll, describe, expect, test } from "bun:test";
import { getTONAddressValidator, getTONToolbox } from "../toolbox";

const TEST_PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const KNOWN_TON_ADDRESS = "EQCC1GV4iL5EkQqICYshf3AF7ESbceCYhVK-go1SkOMOBTNE";

const context: {
  validateAddress: Awaited<ReturnType<typeof getTONAddressValidator>>;
  toolbox: Awaited<ReturnType<typeof getTONToolbox>>;
} = {} as any;

beforeAll(async () => {
  context.validateAddress = await getTONAddressValidator();
  context.toolbox = await getTONToolbox({ phrase: TEST_PHRASE });
});

describe("TON Address Validation", () => {
  test("should validate valid TON addresses", () => {
    const validAddresses = [KNOWN_TON_ADDRESS, "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"];

    for (const address of validAddresses) {
      expect(context.validateAddress(address)).toBe(true);
      expect(context.toolbox.validateAddress(address)).toBe(true);
    }
  });

  test("should reject invalid TON addresses", () => {
    const invalidAddresses = [
      "",
      "invalid",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0Xgg",
    ];

    for (const address of invalidAddresses) {
      expect(context.validateAddress(address)).toBe(false);
      expect(context.toolbox.validateAddress(address)).toBe(false);
    }
  });

  test("should validate address from generated toolbox", () => {
    const address = context.toolbox.getAddress();

    expect(typeof address).toBe("string");
    expect(context.validateAddress(address)).toBe(true);
  });

  test("should handle edge cases", () => {
    const edgeCases = [null, undefined, 123, {}, [], true, false];

    for (const testCase of edgeCases) {
      expect(context.validateAddress(testCase as any)).toBe(false);
      expect(context.toolbox.validateAddress(testCase as any)).toBe(false);
    }
  });
});
