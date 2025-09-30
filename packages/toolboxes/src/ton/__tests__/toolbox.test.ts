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
  test("should create toolbox through main factory", async () => {
    const toolbox = await getTONToolbox();

    expect(typeof toolbox.validateAddress).toBe("function");
    expect(typeof toolbox.getBalance).toBe("function");
    expect(typeof toolbox.transfer).toBe("function");
    expect(typeof toolbox.estimateTransactionFee).toBe("function");
    expect(typeof toolbox.sendTransaction).toBe("function");
  });

  test("should create toolbox with phrase", async () => {
    const toolbox = await getTONToolbox({ phrase: TEST_PHRASE });
    expect(() => toolbox.getAddress()).not.toThrow();
  });

  test("should generate valid TON address from phrase", () => {
    const address = context.toolbox.getAddress();
    expect(typeof address).toBe("string");
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
    const transfer = await context.toolbox.createTransaction({
      assetValue: AssetValue.from({ chain: Chain.Ton, value: "0.001" }),
      recipient: KNOWN_TON_ADDRESS,
    });

    expect(transfer).toBeDefined();
    expect(typeof transfer.hash).toBe("function");
  });
});
