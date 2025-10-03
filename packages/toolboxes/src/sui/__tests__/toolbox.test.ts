import { beforeAll, describe, expect, test } from "bun:test";
import { AssetValue, Chain } from "@swapkit/helpers";
import { getSuiToolbox } from "../toolbox";

const TEST_PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const KNOWN_SUI_ADDRESS = "0x57b861db681d8e47b586e6e9a92f6ed210dbbb440670b8122420848cf0e844fb";

const context: { toolbox: Awaited<ReturnType<typeof getSuiToolbox>> } = {} as any;

beforeAll(async () => {
  context.toolbox = await getSuiToolbox({ phrase: TEST_PHRASE });
});

describe("Sui Toolbox", () => {
  test("should validate valid Sui addresses", () => {
    const validAddresses = [KNOWN_SUI_ADDRESS, "0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331"];

    for (const address of validAddresses) {
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
      expect(context.toolbox.validateAddress(address)).toBe(false);
    }
  });

  test("should generate valid Sui address from phrase", () => {
    const address = context.toolbox.getAddress();
    expect(address?.startsWith("0x")).toBe(true);
    if (address) {
      expect(context.toolbox.validateAddress(address)).toBe(true);
    }
  });

  test("should fetch balance for known address", async () => {
    const balances = await context.toolbox.getBalance(KNOWN_SUI_ADDRESS);
    expect(balances[0]?.chain).toBe(Chain.Sui);
    expect(balances[0]?.symbol).toBe("SUI");
  });

  test("should estimate transaction fee", async () => {
    const fee = await context.toolbox.estimateTransactionFee();
    expect(fee.chain).toBe(Chain.Sui);
    expect(fee.getValue("number")).toBeGreaterThan(0);
  });

  test.skip("should create transaction without broadcasting (needs real SUI for gas)", async () => {
    const address = context.toolbox.getAddress();
    if (!address) throw new Error("No address generated");

    const { txBytes } = await context.toolbox.createTransaction({
      assetValue: AssetValue.from({ chain: Chain.Sui, value: "0.001" }),
      recipient: KNOWN_SUI_ADDRESS,
      sender: address,
    });

    expect(txBytes.length).toBeGreaterThan(0);
  });

  test.skip("should sign transaction (needs real SUI for gas)", async () => {
    const address = context.toolbox.getAddress();
    if (!address) throw new Error("No address generated");

    const signedTx = await context.toolbox.signTransaction({
      assetValue: AssetValue.from({ chain: Chain.Sui, value: "0.001" }),
      recipient: KNOWN_SUI_ADDRESS,
      sender: address,
    });

    expect(signedTx.bytes.length).toBeGreaterThan(0);
  });
});
