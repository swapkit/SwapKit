import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { AssetValue, Chain, getRPCUrl } from "@swapkit/helpers";
import { providers } from "near-api-js";
import { getFullAccessPublicKey } from "../helpers/core";
import { getNearToolbox } from "../toolbox";

const accountId = "ea03292d08136cca439513a33c76af083e5204eceb4ce720320fff84071a447f";

const context: {
  provider: providers.JsonRpcProvider;
  toolbox: Awaited<ReturnType<typeof getNearToolbox>>;
} = {} as any;

beforeAll(async () => {
  const rpcUrl = await getRPCUrl(Chain.Near);
  context.provider = new providers.JsonRpcProvider({ url: rpcUrl });
});

beforeEach(async () => {
  context.toolbox = await getNearToolbox();
});

describe("NEAR createTransaction", () => {
  test("should retrieve full access public key for valid account", async () => {
    const toolbox = context.toolbox;

    const transaction = await toolbox.createTransaction({
      recipient: accountId, // Self transfer
      assetValue: AssetValue.from({
        chain: Chain.Near,
        value: "0.001", // Small amount
      }),
      sender: accountId,
      feeRate: 300000000000000, // 300 TGas
    });

    expect(transaction).toBeDefined();
    expect(transaction.publicKey).toBeDefined();
    expect(transaction.serialized).toBeDefined();
  }, 30000);

  test("should throw error for invalid account", async () => {
    const provider = context.provider;
    const invalidAccountId = "non-existent-account-12345.testnet";

    await expect(async () => {
      await getFullAccessPublicKey(provider, invalidAccountId);
    }).toThrow();
  }, 10000);

  test("should handle network errors gracefully", async () => {
    const invalidProvider = new providers.JsonRpcProvider({ url: "https://invalid-rpc-url.test" });

    await expect(async () => {
      await getFullAccessPublicKey(invalidProvider, "any-account.testnet");
    }).toThrow();
  }, 10000);

  test("should work with contract function call transaction", async () => {
    const toolbox = context.toolbox;
    const provider = context.provider;

    const contractTransaction = await toolbox.createContractFunctionCall({
      sender: accountId,
      contractId: "wrap.testnet", // Known testnet contract
      methodName: "storage_deposit",
      args: { account_id: accountId },
      gas: "300000000000000", // 300 TGas
      attachedDeposit: "1250000000000000000000", // 0.00125 NEAR for storage
    });

    expect(contractTransaction).toBeDefined();
    expect(contractTransaction.publicKey).toBeDefined();

    // Verify the public key can be retrieved directly
    const { publicKey } = await getFullAccessPublicKey(provider, accountId);
    expect(publicKey.toString()).toBe(contractTransaction.publicKey);
  }, 30000);
});
