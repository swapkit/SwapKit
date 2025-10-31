import { beforeAll, describe, expect, test } from "bun:test";
import { AssetValue, Chain } from "@swapkit/helpers";
import { getCosmosToolbox } from "../toolbox";

const TEST_PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const KNOWN_COSMOS_ADDRESS = "cosmos1r5v5srda7xfth3hn2s26txvrcrntldjumt8mhl";

const context: { toolbox: Awaited<ReturnType<typeof getCosmosToolbox>> } = {} as any;

beforeAll(async () => {
  context.toolbox = await getCosmosToolbox(Chain.Cosmos, { phrase: TEST_PHRASE });
});

describe("Cosmos Toolbox", () => {
  test("should validate valid Cosmos addresses", () => {
    const validAddresses = [
      KNOWN_COSMOS_ADDRESS,
      "cosmos12d7d2rlxp7urkp8z0p8sft2fm07ewyjrfvul3f",
      "cosmos1xv9tklw7d82sezh9haa573wufgy59vmwe6xxe5",
    ];

    for (const address of validAddresses) {
      expect(context.toolbox.validateAddress(address)).toBe(true);
    }
  });

  test("should reject invalid Cosmos addresses", () => {
    const invalidAddresses = [
      "",
      "invalid",
      "thor1xv9tklw7d82sezh9haa573wufgy59vmwzp5v3k",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "cosmos1invalid",
    ];

    for (const address of invalidAddresses) {
      expect(context.toolbox.validateAddress(address)).toBe(false);
    }
  });

  test("should generate valid Cosmos address from phrase", async () => {
    const address = await context.toolbox.getAddress();
    if (address) {
      expect(address.startsWith("cosmos1")).toBe(true);
      expect(context.toolbox.validateAddress(address)).toBe(true);
    }
  });

  test("should use 6 decimals for ATOM", () => {
    const atomValue = AssetValue.from({ chain: Chain.Cosmos, value: 3.2 });

    expect(atomValue.decimal).toBe(6);
    expect(atomValue.getBaseValue("string")).toBe("3200000");
  });

  test("should convert ATOM amounts correctly with 6 decimals", () => {
    const testCases = [
      { amount: 0.1, expectedBase: "100000" },
      { amount: 1, expectedBase: "1000000" },
      { amount: 3.2, expectedBase: "3200000" },
      { amount: 10.5, expectedBase: "10500000" },
      { amount: 100, expectedBase: "100000000" },
      { amount: 0.000001, expectedBase: "1" },
    ];

    for (const { amount, expectedBase } of testCases) {
      const atomValue = AssetValue.from({ chain: Chain.Cosmos, value: amount });
      expect(atomValue).toMatchObject({ decimal: 6 });
      expect(atomValue.getBaseValue("string")).toBe(expectedBase);
    }
  });

  test("should fetch balance for known address", async () => {
    const balances = await context.toolbox.getBalance(KNOWN_COSMOS_ADDRESS);
    expect(balances[0]).toMatchObject({ chain: Chain.Cosmos, decimal: 6, symbol: "ATOM" });
  });

  test("should not have 8 decimal bug (would be 100x too much)", () => {
    const atomValue = AssetValue.from({ chain: Chain.Cosmos, value: 3.2 });
    expect(Number.parseInt(atomValue.getBaseValue("string"), 10)).toBe(3200000);
  });

  test("should have minimum fee of 1000 uatom to meet network requirements", async () => {
    const fees = await context.toolbox.getFees();

    expect(fees.average.getBaseValue("number")).toBeGreaterThanOrEqual(1000);
    expect(fees.fast.getBaseValue("number")).toBeGreaterThanOrEqual(1000);
    expect(fees.fastest.getBaseValue("number")).toBeGreaterThanOrEqual(1000);
  });
});
