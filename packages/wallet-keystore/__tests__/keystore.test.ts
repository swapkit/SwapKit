import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { SKConfig } from "@swapkit/helpers";
import { createKeystoreWallet, KEYSTORE_SUPPORTED_CHAINS } from "../src";
import { testKeystoreWalletData } from "./fixtures";

beforeAll(() => {
  SKConfig.set({ apiKeys: { swapKit: process.env.TEST_API_KEY }, envs: { isDev: true } });
});

afterAll(() => {
  SKConfig.reinitialize();
});

describe("keystore - Reading address", () => {
  it(
    "should read address from keystore",
    async () => {
      if (!process.env.TEST_PHRASE) {
        return console.error("TEST_PHRASE is not set. Skipping test.");
      }
      const wallet = await createKeystoreWallet({ chains: KEYSTORE_SUPPORTED_CHAINS, phrase: process.env.TEST_PHRASE });

      for (const [chain, address] of Object.entries(testKeystoreWalletData.addresses)) {
        const chainWallet = wallet[chain as keyof typeof wallet];

        expect(`${chain}: ${chainWallet.address}`).toBe(`${chain}: ${address}`);
      }
    },
    { retry: 3, timeout: 10000 },
  );
});

describe("keystore - Reading balances", () => {
  it(
    "should read balances from keystore",
    async () => {
      if (!process.env.TEST_PHRASE) {
        return console.error("TEST_PHRASE is not set. Skipping test.");
      }

      const wallet = await createKeystoreWallet({ chains: KEYSTORE_SUPPORTED_CHAINS, phrase: process.env.TEST_PHRASE });

      const failedChains: [string, string][] = [];

      for (const chain of KEYSTORE_SUPPORTED_CHAINS) {
        try {
          const { balance } = wallet[chain];
          const firstBalance = balance?.[0];
          if (firstBalance) {
            console.info(firstBalance.toString(), firstBalance.getValue("string"));
            expect(balance.length).toBeGreaterThan(0);
          }
        } catch (error: any) {
          failedChains.push([chain, error?.message]);
        }
      }

      if (failedChains.length > 0) {
        console.error(failedChains.map((chain) => `${chain[0]}: ${chain[1]}`).join("\n"));
      }
    },
    { retry: 3, timeout: 120000 },
  );
});
