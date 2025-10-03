import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { AssetValue, Chain, SKConfig } from "@swapkit/helpers";
import { createTronToolbox, getTronAddressValidator } from "../toolbox";

const context: {
  toolbox: Awaited<ReturnType<typeof createTronToolbox>>;
  validateAddress: (address: string) => boolean;
} = {} as any;

beforeAll(async () => {
  // Set up TRON mainnet configuration
  SKConfig.set({ rpcUrls: { [Chain.Tron]: ["https://api.trongrid.io"] } });

  // Get the address validator
  context.validateAddress = await getTronAddressValidator();
});

beforeEach(async () => {
  context.toolbox = await createTronToolbox({ phrase: process.env.TEST_PHRASE });
});

afterAll(() => {
  SKConfig.reinitialize();
});

describe("TRON Address Validation", () => {
  test("should validate valid TRON addresses", () => {
    const validAddresses = [
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // USDT contract
      "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7", // Mainnet address
      "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", // Another valid address
    ];

    for (const address of validAddresses) {
      expect(context.validateAddress(address)).toBe(true);
      expect(context.toolbox.validateAddress(address)).toBe(true);
    }
  });

  test("should reject invalid TRON addresses", () => {
    const invalidAddresses = [
      "", // Empty string
      "invalid", // Random string
      "0x742d35Cc6648C532F5e7c3d2a7a8E1e1e5b7c8D3", // Ethereum address
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // Bitcoin address
      "cosmos1abc123", // Cosmos address
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6", // Too short
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6tt", // Too long
      "XR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // Wrong prefix
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6O", // Invalid checksum
    ];

    for (const address of invalidAddresses) {
      expect(context.validateAddress(address)).toBe(false);
      expect(context.toolbox.validateAddress(address)).toBe(false);
    }
  });

  test("should validate address from generated account", async () => {
    const toolbox = context.toolbox;

    // Get address from the toolbox
    const address = await toolbox.getAddress();

    expect(address).toBeDefined();
    expect(typeof address).toBe("string");
    expect(address.length).toBeGreaterThan(0);

    // The generated address should be valid
    expect(context.validateAddress(address)).toBe(true);
    expect(toolbox.validateAddress(address)).toBe(true);

    // Address should start with 'T'
    expect(address.startsWith("T")).toBe(true);
  });

  test("should create TRON transaction with valid addresses", async () => {
    const toolbox = context.toolbox;
    const fromAddress = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
    const toAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Valid TRON address

    // Both addresses should be valid
    expect(toolbox.validateAddress(fromAddress)).toBe(true);
    expect(toolbox.validateAddress(toAddress)).toBe(true);

    // Create a transaction
    const transaction = await toolbox.createTransaction({
      assetValue: AssetValue.from({
        chain: Chain.Tron,
        value: "1", // 1 TRX
      }),
      recipient: toAddress,
      sender: fromAddress,
    });

    expect(transaction).toBeDefined();
    expect(transaction.raw_data_hex).toBeDefined();
  });

  test("should create TRON.USDT transaction with valid addresses", async () => {
    const toolbox = context.toolbox;
    const fromAddress = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
    const toAddress = "TT87ESmqUmH87hMx1MKCEqYrJKaQyNg9ao"; // Valid TRON address

    // Both addresses should be valid
    expect(toolbox.validateAddress(fromAddress)).toBe(true);
    expect(toolbox.validateAddress(toAddress)).toBe(true);

    // Create a transaction
    const transaction = await toolbox.createTransaction({
      assetValue: AssetValue.from({
        asset: "TRON.USDT-TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        value: "100", // 1 TRX
      }),
      recipient: toAddress,
      sender: fromAddress,
    });

    expect(transaction).toBeDefined();
    expect(transaction.raw_data_hex).toBeDefined();
  });

  test("should handle case sensitivity in addresses", () => {
    const address = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const lowerCase = address.toLowerCase();
    const upperCase = address.toUpperCase();

    // TRON addresses are case sensitive - only the original should be valid
    expect(context.validateAddress(address)).toBe(true);
    expect(context.validateAddress(lowerCase)).toBe(false);
    expect(context.validateAddress(upperCase)).toBe(false);
  });

  test("should handle edge cases", () => {
    const edgeCases = [null, undefined, 123, {}, [], true, false];

    for (const testCase of edgeCases) {
      // Should not throw but return false for invalid inputs
      expect(context.validateAddress(testCase as any)).toBe(false);
      expect(context.toolbox.validateAddress(testCase as any)).toBe(false);
    }
  });
});
