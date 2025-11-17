import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { AssetValue, Chain, SKConfig } from "@swapkit/helpers";
import { createTronToolbox, getTronAddressValidator } from "../toolbox";

const context: {
  toolbox: Awaited<ReturnType<typeof createTronToolbox>>;
  validateAddress: (address: string) => boolean;
} = {} as any;

beforeAll(async () => {
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
      "",
      "invalid",
      "0x742d35Cc6648C532F5e7c3d2a7a8E1e1e5b7c8D3",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "cosmos1abc123",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6tt",
      "XR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6O",
    ];

    for (const address of invalidAddresses) {
      expect(context.validateAddress(address)).toBe(false);
      expect(context.toolbox.validateAddress(address)).toBe(false);
    }
  });

  test("should create TRON transaction with valid addresses", async () => {
    const toolbox = context.toolbox;
    const fromAddress = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
    const toAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

    expect(toolbox.validateAddress(fromAddress)).toBe(true);
    expect(toolbox.validateAddress(toAddress)).toBe(true);

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
    const toAddress = "TT87ESmqUmH87hMx1MKCEqYrJKaQyNg9ao";

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

    expect(context.validateAddress(address)).toBe(true);
    expect(context.validateAddress(lowerCase)).toBe(false);
    expect(context.validateAddress(upperCase)).toBe(false);
  });

  test("should handle edge cases", () => {
    const edgeCases = [null, undefined, 123, {}, [], true, false];

    for (const testCase of edgeCases) {
      expect(context.validateAddress(testCase as any)).toBe(false);
      expect(context.toolbox.validateAddress(testCase as any)).toBe(false);
    }
  });
});

describe("TRON createTransaction with Extended Expiration", () => {
  const baseExpiration = 60; // default is 60s
  const extendedExpiration = 240; // Adding 240 for 5 minutes total
  const fromAddress = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
  const toAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
  const buffer = 10000;
  const memo = "Test transfer with memo";

  test("should create native TRX transfer with extended expiration", async () => {
    const toolbox = context.toolbox;
    const beforeTimestamp = Date.now();

    const transaction = await toolbox.createTransaction({
      assetValue: AssetValue.from({
        chain: Chain.Tron,
        value: "1", // 1 TRX
      }),
      expiration: extendedExpiration,
      recipient: toAddress,
      sender: fromAddress,
    });

    expect(transaction.raw_data.expiration).toBeDefined();

    const expectedExpiration = beforeTimestamp + (baseExpiration + extendedExpiration) * 1000;
    const actualExpiration = transaction.raw_data.expiration;

    expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - buffer);
    expect(actualExpiration).toBeLessThanOrEqual(expectedExpiration + buffer);
  });

  test("should create native TRX transfer with extended expiration and memo", async () => {
    const toolbox = context.toolbox;
    const beforeTimestamp = Date.now();

    const transaction = await toolbox.createTransaction({
      assetValue: AssetValue.from({
        chain: Chain.Tron,
        value: "1", // 1 TRX
      }),
      expiration: extendedExpiration,
      memo,
      recipient: toAddress,
      sender: fromAddress,
    });

    expect(transaction.raw_data.expiration).toBeDefined();

    const expectedExpiration = beforeTimestamp + (baseExpiration + extendedExpiration) * 1000;
    const actualExpiration = transaction.raw_data.expiration;

    expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - buffer);
    expect(actualExpiration).toBeLessThanOrEqual(expectedExpiration + buffer);

    expect(transaction.raw_data.data).toBeDefined();
  });

  test("should create token transfer with extended expiration", async () => {
    const toolbox = context.toolbox;
    const beforeTimestamp = Date.now();

    const transaction = await toolbox.createTransaction({
      assetValue: AssetValue.from({
        asset: "TRON.USDT-TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        value: "100", // 100 USDT
      }),
      expiration: extendedExpiration,
      recipient: toAddress,
      sender: fromAddress,
    });

    expect(transaction.raw_data.expiration).toBeDefined();

    const expectedExpiration = beforeTimestamp + (baseExpiration + extendedExpiration) * 1000;
    const actualExpiration = transaction.raw_data.expiration;

    // Allow 10 second tolerance for test execution time
    expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - buffer);
    expect(actualExpiration).toBeLessThanOrEqual(expectedExpiration + buffer);
  });

  test("should create token transfer with extended expiration and memo", async () => {
    const toolbox = context.toolbox;
    const beforeTimestamp = Date.now();

    const transaction = await toolbox.createTransaction({
      assetValue: AssetValue.from({
        asset: "TRON.USDT-TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        value: "100", // 100 USDT
      }),
      expiration: extendedExpiration,
      memo,
      recipient: toAddress,
      sender: fromAddress,
    });

    const expectedExpiration = beforeTimestamp + (baseExpiration + extendedExpiration) * 1000;
    const actualExpiration = transaction.raw_data.expiration;

    expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - buffer);
    expect(actualExpiration).toBeLessThanOrEqual(expectedExpiration + buffer);
    expect(transaction.raw_data).toMatchObject({ data: expect.any(String), expiration: expect.any(Number) });
  });
});
