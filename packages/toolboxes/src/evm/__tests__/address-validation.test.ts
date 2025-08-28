import { beforeAll, describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/helpers";
import { getEvmToolbox } from "../toolbox";

const context: { validateAddress: (address: string) => boolean } = {} as any;

beforeAll(async () => {
  // Get EVM toolbox for address validation
  const toolbox = await getEvmToolbox(Chain.Ethereum);
  context.validateAddress = toolbox.validateAddress;
});

describe("EVM Address Validation", () => {
  test("should validate valid EVM addresses", () => {
    const validAddresses = [
      "0xa052Ddf1c1739419B90FB7bf722843AD3e63114B", // User provided address
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC contract
      "0x6d6e022eE439C8aB8B7a7dBb0576f8090319CDc6", // Test address
      "0xE29E61479420Dd1029A9946710Ac31A0d140e77F", // Another valid address
      "0x0000000000000000000000000000000000000000", // Zero address
      "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF", // Max address
      "0x1234567890123456789012345678901234567890", // Mixed case
    ];

    for (const address of validAddresses) {
      expect(context.validateAddress(address)).toBe(true);
    }
  });

  test("should reject invalid EVM addresses", () => {
    const invalidAddresses = [
      "", // Empty string
      "invalid", // Random string
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // TRON address
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // Bitcoin address
      "cosmos1abc123", // Cosmos address
      "0xa052Ddf1c1739419B90FB7bf722843AD3e63114", // Too short (missing 1 char)
      "0xa052Ddf1c1739419B90FB7bf722843AD3e63114BB", // Too long (extra char)
      "0XA052DDF1C1739419B90FB7BF722843AD3E63114B", // Uppercase 0X prefix
      "0xG052Ddf1c1739419B90FB7bf722843AD3e63114B", // Invalid hex character
      "0x", // Only prefix
    ];

    for (const address of invalidAddresses) {
      expect(context.validateAddress(address)).toBe(false);
    }
  });

  test("should handle case normalization properly", () => {
    const address = "0xa052Ddf1c1739419B90FB7bf722843AD3e63114B"; // Proper checksum
    const lowerCase = address.toLowerCase();

    // Valid case variations should be accepted
    expect(context.validateAddress(address)).toBe(true);
    expect(context.validateAddress(lowerCase)).toBe(true);
  });

  test("should reject invalid checksum addresses", () => {
    const invalidChecksumAddress = "0xA052dDF1C1739419b90fb7BF722843ad3E63114b"; // Invalid checksum

    // Should reject mixed case with invalid checksum
    expect(context.validateAddress(invalidChecksumAddress)).toBe(false);
  });

  test("should handle edge cases", () => {
    const edgeCases = [null, undefined, 123, {}, [], true, false];

    for (const testCase of edgeCases) {
      // Should not throw but return false for invalid inputs
      expect(context.validateAddress(testCase as any)).toBe(false);
    }
  });

  test("should validate checksummed addresses", () => {
    const checksummedAddresses = [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC with proper checksum
      "0x6d6e022eE439C8aB8B7a7dBb0576f8090319CDc6", // Another checksummed address
    ];

    for (const address of checksummedAddresses) {
      expect(context.validateAddress(address)).toBe(true);
    }
  });
});
