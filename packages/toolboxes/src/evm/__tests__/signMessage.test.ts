import { describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/helpers";
import { getEvmToolbox } from "../toolbox";

const TEST_PHRASE = "test test test test test test test test test test test junk";
const TEST_MESSAGE = "Hello, this is a test message for SIWE";
const EXPECTED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("EVM signMessage", () => {
  test("should sign message with phrase-based signer", async () => {
    const toolbox = await getEvmToolbox(Chain.Ethereum, { phrase: TEST_PHRASE });

    const address = await toolbox.getAddress();
    expect(address).toBe(EXPECTED_ADDRESS);

    const signature = await toolbox.signMessage?.(TEST_MESSAGE);

    expect(signature).toBeDefined();
    expect(typeof signature).toBe("string");
  });

  test("should sign Uint8Array message with phrase-based signer", async () => {
    const toolbox = await getEvmToolbox(Chain.Ethereum, { phrase: TEST_PHRASE });

    const messageBytes = new TextEncoder().encode(TEST_MESSAGE);
    const signature = await toolbox.signMessage?.(messageBytes);

    expect(signature).toBeDefined();
    expect(typeof signature).toBe("string");
  });

  test("should produce consistent signatures for same message", async () => {
    const toolbox = await getEvmToolbox(Chain.Ethereum, { phrase: TEST_PHRASE });

    const signature1 = await toolbox.signMessage?.(TEST_MESSAGE);
    const signature2 = await toolbox.signMessage?.(TEST_MESSAGE);

    expect(signature1).toBeDefined();
    expect(signature2).toBeDefined();
    expect(signature1).toBe(signature2 as string);
  });

  test("should handle signMessage when no signer is present", async () => {
    const toolbox = await getEvmToolbox(Chain.Ethereum);

    expect(toolbox.signMessage).toBeUndefined();
  });

  test("should work with different EVM chains", async () => {
    const chains = [Chain.Ethereum, Chain.Arbitrum, Chain.Polygon, Chain.BinanceSmartChain] as const;

    for (const chain of chains) {
      const toolbox = await getEvmToolbox(chain, { phrase: TEST_PHRASE });
      const signature = await toolbox.signMessage?.(TEST_MESSAGE);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe("string");
    }
  });
});
