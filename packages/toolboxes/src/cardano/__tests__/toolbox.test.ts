import { beforeAll, describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/helpers";
import { getCardanoToolbox } from "../toolbox";

const TEST_PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

const context: { toolbox: Awaited<ReturnType<typeof getCardanoToolbox>> } = {} as any;

beforeAll(async () => {
  context.toolbox = await getCardanoToolbox({ phrase: TEST_PHRASE });
});

describe("Cardano Toolbox", () => {
  test("should create toolbox through main factory", async () => {
    const toolbox = await getCardanoToolbox();

    expect(typeof toolbox.getAddress).toBe("function");
    expect(typeof toolbox.getBalance).toBe("function");
    expect(typeof toolbox.transfer).toBe("function");
    expect(typeof toolbox.estimateTransactionFee).toBe("function");
  });

  test("should create toolbox with phrase", async () => {
    const toolbox = await getCardanoToolbox({ phrase: TEST_PHRASE });
    expect(() => toolbox.getAddress()).not.toThrow();
  });

  test("should generate valid Cardano address from phrase", () => {
    const address = context.toolbox.getAddress();
    expect(typeof address).toBe("string");
    expect(address.startsWith("addr")).toBe(true);
  });

  test("should estimate transaction fee", async () => {
    const fee = await context.toolbox.estimateTransactionFee();
    expect(fee.chain).toBe(Chain.Cardano);
    expect(fee.getValue("number")).toBeGreaterThan(0);
  });
});
