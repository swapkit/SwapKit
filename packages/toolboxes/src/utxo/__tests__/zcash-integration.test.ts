import { describe, expect, it } from "bun:test";
import { Chain, DerivationPath } from "@swapkit/helpers";
import { getUtxoToolbox } from "../toolbox";

describe("UTXO Toolbox Zcash Integration", () => {
  const testPhrase =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  it("should create Zcash toolbox through main UTXO toolbox factory", async () => {
    const toolbox = await getUtxoToolbox(Chain.Zcash);

    expect(toolbox).toBeDefined();
    expect(typeof toolbox.validateAddress).toBe("function");
    expect(typeof toolbox.getBalance).toBe("function");
    expect(typeof toolbox.getFeeRates).toBe("function");
    expect(typeof toolbox.broadcastTx).toBe("function");
    expect(typeof toolbox.createTransaction).toBe("function");
    expect(typeof toolbox.transfer).toBe("function");
  });

  it("should create Zcash toolbox with phrase", async () => {
    const toolbox = await getUtxoToolbox(Chain.Zcash, {
      phrase: testPhrase,
    });

    expect(toolbox).toBeDefined();
    expect(() => toolbox.getAddress()).not.toThrow();
  });

  it("should generate valid Zcash addresses", async () => {
    const toolbox = await getUtxoToolbox(Chain.Zcash, {
      phrase: testPhrase,
    });

    const address = await toolbox.getAddress();
    expect(address).toBeDefined();
    expect(typeof address).toBe("string");
    expect(address?.startsWith("t1")).toBe(true); // Zcash mainnet addresses start with t1
    expect(toolbox.validateAddress(address || "")).toBe(true);
  });

  it("should validate Zcash addresses correctly", async () => {
    const toolbox = await getUtxoToolbox(Chain.Zcash);

    // Valid Zcash mainnet address format
    expect(toolbox.validateAddress("t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F")).toBe(true);

    // Invalid addresses
    expect(toolbox.validateAddress("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2")).toBe(false); // Bitcoin address
    expect(toolbox.validateAddress("zcash:qr5agtachyxvrwxu76vzszan5pnvuzy8dm")).toBe(false); // Wrong format
    expect(toolbox.validateAddress("")).toBe(false); // Empty string
    expect(toolbox.validateAddress("invalid")).toBe(false); // Invalid string
  });

  it("should reject shielded addresses", async () => {
    const toolbox = await getUtxoToolbox(Chain.Zcash);

    // Test z-address (shielded) - should be rejected with warning
    const originalWarn = console.warn;
    let warnCalled = false;
    let warnMessage = "";

    console.warn = (message: string) => {
      warnCalled = true;
      warnMessage = message;
    };

    const isValid = toolbox.validateAddress(
      "zs1z7rejlpsa98s2rrrfkwmaxu2xldqmfq5nj2m3hq6s7r8qjq8eqqqq9p4e7x",
    );

    expect(isValid).toBe(false);
    expect(warnCalled).toBe(true);
    expect(warnMessage).toBe(
      "Shielded Zcash addresses (z-addresses) are not supported. Use transparent addresses (t1/t3) only.",
    );

    console.warn = originalWarn;
  });

  it("should create keys for derivation path", async () => {
    const toolbox = await getUtxoToolbox(Chain.Zcash, {
      phrase: testPhrase,
    });

    const keys = await toolbox.createKeysForPath({
      phrase: testPhrase,
      derivationPath: DerivationPath.ZEC,
    });

    expect(keys).toBeDefined();
    expect(keys.publicKey).toBeDefined();
    expect(keys.privateKey).toBeDefined();
    expect(typeof keys.toWIF).toBe("function");

    const address = await toolbox.getAddress();
    expect(address).toBeDefined();
    expect(address?.startsWith("t1")).toBe(true);
  });

  it("should get WIF private key from mnemonic", async () => {
    const toolbox = await getUtxoToolbox(Chain.Zcash, {
      phrase: testPhrase,
    });

    const wif = await toolbox.getPrivateKeyFromMnemonic({
      phrase: testPhrase,
      derivationPath: DerivationPath.ZEC,
    });

    expect(typeof wif).toBe("string");
    expect(wif.length).toBeGreaterThan(50); // WIF keys are typically 51-52 characters
  });
});
