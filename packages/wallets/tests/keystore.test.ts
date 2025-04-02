import { beforeEach, describe, expect, it } from "bun:test";
import { SKConfig, SwapKit } from "@swapkit/core";
import { KEYSTORE_SUPPORTED_CHAINS, keystoreWallet } from "../src/keystore";
import { testKeystoreWalletData } from "./fixtures";

beforeEach(() => {
  SKConfig.set({
    apiKeys: { swapKit: process.env.TEST_API_KEY },
    envs: { isDev: true },
  });
});

describe("keystore - Reading address", () => {
  it("should read address from keystore", async () => {
    if (!process.env.TEST_PHRASE) {
      return console.error("TEST_PHRASE is not set. Skipping test.");
    }

    const swapKitClient = SwapKit({ wallets: keystoreWallet });
    await swapKitClient.connectKeystore(KEYSTORE_SUPPORTED_CHAINS, process.env.TEST_PHRASE);
    const wallet = swapKitClient.getAllWallets();

    for (const [chain, address] of Object.entries(testKeystoreWalletData.addresses)) {
      const chainWallet = wallet[chain];
      if (chainWallet) {
        expect(chainWallet.address).toBe(address);
      }
    }
  });
});

describe("keystore - Reading balances", () => {
  it(
    "should read balances from keystore",
    async () => {
      if (!process.env.TEST_PHRASE) {
        return console.error("TEST_PHRASE is not set. Skipping test.");
      }

      const swapKitClient = SwapKit({ wallets: keystoreWallet });
      await swapKitClient.connectKeystore(KEYSTORE_SUPPORTED_CHAINS, process.env.TEST_PHRASE);

      const failedChains: [string, string][] = [];

      for (const chain of KEYSTORE_SUPPORTED_CHAINS) {
        try {
          const wallet = await swapKitClient.getWalletWithBalance(chain);
          if (wallet) {
            console.info(wallet.balance[0].toString(), wallet.balance[0].getValue("string"));
            expect(wallet.balance.length).toBeGreaterThan(0);
          }
        } catch (error) {
          failedChains.push([chain, error.message]);
        }
      }

      if (failedChains.length > 0) {
        console.error(failedChains.map((chain) => `${chain[0]}: ${chain[1]}`).join("\n"));
      }
    },
    { timeout: 30000 },
  );
});
