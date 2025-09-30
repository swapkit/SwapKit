import { beforeAll, describe, expect, test } from "bun:test";
import { getSuiAddressValidator, getSuiToolbox } from "../toolbox";

const TEST_PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const KNOWN_SUI_ADDRESS = "0x57b861db681d8e47b586e6e9a92f6ed210dbbb440670b8122420848cf0e844fb";

const context: {
  validateAddress: Awaited<ReturnType<typeof getSuiAddressValidator>>;
  toolbox: Awaited<ReturnType<typeof getSuiToolbox>>;
} = {} as any;

beforeAll(async () => {
  context.validateAddress = await getSuiAddressValidator();
  context.toolbox = await getSuiToolbox({ phrase: TEST_PHRASE });
});

describe("Sui Address Validation", () => {
  test("should validate valid Sui addresses", () => {
    const validAddresses = [KNOWN_SUI_ADDRESS, "0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331"];

    for (const address of validAddresses) {
      expect(context.validateAddress(address)).toBe(true);
      expect(context.toolbox.validateAddress(address)).toBe(true);
    }
  });

  test("should reject invalid Sui addresses", () => {
    const invalidAddresses = [
      "",
      "invalid",
      "0xG2a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    ];

    for (const address of invalidAddresses) {
      expect(context.validateAddress(address)).toBe(false);
      expect(context.toolbox.validateAddress(address)).toBe(false);
    }
  });

  test("should validate address from generated toolbox", () => {
    const address = context.toolbox.getAddress();

    expect(typeof address).toBe("string");
    expect(address?.startsWith("0x")).toBe(true);
    if (address) {
      expect(context.validateAddress(address)).toBe(true);
    }
  });

  test("should handle edge cases", () => {
    const edgeCases = [null, undefined, 123, {}, [], true, false];

    for (const testCase of edgeCases) {
      expect(context.validateAddress(testCase as any)).toBe(false);
      expect(context.toolbox.validateAddress(testCase as any)).toBe(false);
    }
  });
});
