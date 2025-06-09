import { describe, expect, it } from "bun:test";
import { Chain } from "@swapkit/helpers";
import { getUtxoToolbox } from "../toolbox";

describe("UTXO Toolbox Zcash Integration", () => {
  it("should create Zcash toolbox through main UTXO toolbox factory", async () => {
    const toolbox = await getUtxoToolbox(Chain.Zcash);

    expect(toolbox).toBeDefined();
    expect(typeof toolbox.validateAddress).toBe("function");
    expect(typeof toolbox.getBalance).toBe("function");
  });

  it("should create Zcash toolbox with phrase", async () => {
    const testPhrase =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    const toolbox = await getUtxoToolbox(Chain.Zcash, {
      phrase: testPhrase,
      index: 0,
    });

    expect(toolbox).toBeDefined();
    expect(() => toolbox.getAddress()).not.toThrow();
  });
});
