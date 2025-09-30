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
  test("should create toolbox through main factory", async () => {
    const toolbox = await getSuiToolbox();

    expect(typeof toolbox.validateAddress).toBe("function");
    expect(typeof toolbox.getBalance).toBe("function");
    expect(typeof toolbox.transfer).toBe("function");
    expect(typeof toolbox.estimateTransactionFee).toBe("function");
    expect(typeof toolbox.createTransaction).toBe("function");
    expect(typeof toolbox.signTransaction).toBe("function");
  });

  test("should create toolbox with phrase", async () => {
    const toolbox = await getSuiToolbox({ phrase: TEST_PHRASE });
    expect(() => toolbox.getAddress()).not.toThrow();
  });

  test("should generate valid Sui address from phrase", () => {
    const address = context.toolbox.getAddress();
    expect(typeof address).toBe("string");
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

    const { tx, txBytes } = await context.toolbox.createTransaction({
      assetValue: AssetValue.from({ chain: Chain.Sui, value: "0.001" }),
      recipient: KNOWN_SUI_ADDRESS,
      sender: address,
    });

    expect(tx).toBeDefined();
    expect(txBytes).toBeDefined();
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

    expect(signedTx.signature).toBeDefined();
    expect(signedTx.bytes).toBeDefined();
  });
});
