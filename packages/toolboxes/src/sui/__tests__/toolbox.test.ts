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

  test(
    "should fetch balance for known address",
    async () => {
      const balances = await context.toolbox.getBalance(KNOWN_SUI_ADDRESS);
      expect(balances[0]?.chain).toBe(Chain.Sui);
      expect(balances[0]?.symbol).toBe("SUI");
    },
    { retry: 3, timeout: 10000 },
  );

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

  describe("Token Transfers", () => {
    // Native USDC on SUI - https://suiscan.xyz/mainnet/coin/0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC
    const USDC_COIN_TYPE = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
    // Address with USDC balance: https://suiscan.xyz/mainnet/account/0x48a451b8a98f4e9cda542e4a87ab2449c9d3e53fbe1bac991ae38de4599143a0/portfolio
    const ADDRESS_WITH_USDC = "0x48a451b8a98f4e9cda542e4a87ab2449c9d3e53fbe1bac991ae38de4599143a0";

    test("should create AssetValue for USDC token with correct address", () => {
      const usdcAsset = AssetValue.from({ asset: `${Chain.Sui}.USDC-${USDC_COIN_TYPE}`, value: "1" });

      expect(usdcAsset.address).toBe(USDC_COIN_TYPE);
      expect(usdcAsset.isGasAsset).toBe(false);
      expect(usdcAsset.chain).toBe(Chain.Sui);
    });

    test(
      "should throw error when no coins found for token transfer",
      async () => {
        const address = context.toolbox.getAddress();
        if (!address) throw new Error("No address generated");

        const usdcAsset = AssetValue.from({ asset: `${Chain.Sui}.USDC-${USDC_COIN_TYPE}`, value: "1" });

        await expect(
          context.toolbox.createTransaction({ assetValue: usdcAsset, recipient: KNOWN_SUI_ADDRESS, sender: address }),
        ).rejects.toThrow("toolbox_sui_no_coins_found");
      },
      { timeout: 15000 },
    );

    test("should throw error when coin type is missing", async () => {
      const address = context.toolbox.getAddress();
      if (!address) throw new Error("No address generated");

      const invalidAsset = AssetValue.from({ chain: Chain.Sui, value: "1" });
      Object.defineProperty(invalidAsset, "isGasAsset", { value: false });
      Object.defineProperty(invalidAsset, "symbol", { value: "FAKE" });
      Object.defineProperty(invalidAsset, "address", { value: undefined });

      await expect(
        context.toolbox.createTransaction({ assetValue: invalidAsset, recipient: KNOWN_SUI_ADDRESS, sender: address }),
      ).rejects.toThrow("toolbox_sui_missing_coin_type");
    });

    test(
      "should create USDC transfer transaction for address with USDC balance",
      async () => {
        const usdcAsset = AssetValue.from({ asset: `${Chain.Sui}.USDC-${USDC_COIN_TYPE}`, value: "0.01" });

        const { tx, txBytes } = await context.toolbox.createTransaction({
          assetValue: usdcAsset,
          recipient: KNOWN_SUI_ADDRESS,
          sender: ADDRESS_WITH_USDC,
        });

        expect(tx).toBeDefined();
        expect(txBytes).toBeInstanceOf(Uint8Array);
        expect(txBytes.length).toBeGreaterThan(0);

        const txData = tx.getData();

        expect(txData.sender).toBe(ADDRESS_WITH_USDC);

        const commands = txData.commands;
        expect(commands.length).toBeGreaterThanOrEqual(2);

        const transferCmd = commands.find((cmd) => "$kind" in cmd && cmd.$kind === "TransferObjects");
        expect(transferCmd).toBeDefined();

        const splitCmd = commands.find((cmd) => "$kind" in cmd && cmd.$kind === "SplitCoins");
        expect(splitCmd).toBeDefined();

        expect(txData.inputs.length).toBeGreaterThan(0);
      },
      { timeout: 30000 },
    );
  });
});
