import { beforeAll, describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/helpers";
import { getCardanoToolbox } from "../toolbox";

const TEST_PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

const context: { toolbox: Awaited<ReturnType<typeof getCardanoToolbox>> } = {} as any;

beforeAll(async () => {
  context.toolbox = await getCardanoToolbox({ phrase: TEST_PHRASE });
});

describe("Cardano Toolbox", () => {
  test("should validate valid Cardano addresses", () => {
    const validAddresses = [
      "addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs68faae",
    ];

    for (const address of validAddresses) {
      expect(context.toolbox.validateAddress(address)).toBe(true);
    }
  });

  test("should reject invalid Cardano addresses", () => {
    const invalidAddresses = [
      "",
      "invalid",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    ];

    for (const address of invalidAddresses) {
      expect(context.toolbox.validateAddress(address)).toBe(false);
    }
  });

  test("should generate valid Cardano address from phrase", () => {
    const address = context.toolbox.getAddress();
    expect(address.startsWith("addr")).toBe(true);
  });

  test("should estimate transaction fee", async () => {
    const fee = await context.toolbox.estimateTransactionFee();
    expect(fee.chain).toBe(Chain.Cardano);
    expect(fee.getValue("number")).toBeGreaterThan(0);
  });
});
