import { beforeAll, describe, expect, test } from "bun:test";
import { AssetValue, Chain } from "@swapkit/helpers";
import { getTONToolbox } from "../toolbox";

const TEST_PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const KNOWN_TON_ADDRESS = "EQCC1GV4iL5EkQqICYshf3AF7ESbceCYhVK-go1SkOMOBTNE";

const context: { toolbox: Awaited<ReturnType<typeof getTONToolbox>> } = {} as any;

beforeAll(async () => {
  context.toolbox = await getTONToolbox({ phrase: TEST_PHRASE });
});

describe("TON Toolbox", () => {
  test("should validate valid TON addresses", () => {
    const validAddresses = [KNOWN_TON_ADDRESS, "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"];

    for (const address of validAddresses) {
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
    ];

    for (const address of invalidAddresses) {
      expect(context.toolbox.validateAddress(address)).toBe(false);
    }
  });

  test("should generate valid TON address from phrase", () => {
    const address = context.toolbox.getAddress();
    expect(context.toolbox.validateAddress(address)).toBe(true);
  });

  test("should fetch balance for known address", async () => {
    const balances = await context.toolbox.getBalance(KNOWN_TON_ADDRESS);
    expect(balances[0]?.chain).toBe(Chain.Ton);
    expect(balances[0]?.symbol).toBe("TON");
  });

  test("should estimate transaction fee", async () => {
    const fee = await context.toolbox.estimateTransactionFee();
    expect(fee.chain).toBe(Chain.Ton);
    expect(fee.getValue("number")).toBeGreaterThan(0);
  });

  test("should create transaction without broadcasting", async () => {
    const transferCell = await context.toolbox.createTransaction({
      assetValue: AssetValue.from({ chain: Chain.Ton, value: "0.001" }),
      recipient: KNOWN_TON_ADDRESS,
    });

    const hash = transferCell.hash().toString("hex");
    expect(hash.length).toBeGreaterThan(0);
  });
});
