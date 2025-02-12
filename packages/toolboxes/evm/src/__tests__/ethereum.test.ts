import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type ethers from "@nomicfoundation/hardhat-ethers";
import helpers from "@nomicfoundation/hardhat-network-helpers";
import { AssetValue, Chain, FeeOption, erc20ABI } from "@swapkit/helpers";
import type { JsonRpcProvider, JsonRpcSigner } from "ethers";
import hre from "hardhat";

import { ETHToolbox } from "../index";
import { getProvider } from "../provider";
const testAddress = "0x6d6e022eE439C8aB8B7a7dBb0576f8090319CDc6";
const emptyRecipient = "0xE29E61479420Dd1029A9946710Ac31A0d140e77F";
const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
// Get latest block to use as base for reset fork after test
const block = await hre.ethers.provider.getBlock("latest");

beforeAll(() => {
  hre.run("node");
});

const context: {
  ethers: typeof ethers;
  provider: JsonRpcProvider;
  toolbox: ReturnType<typeof ETHToolbox>;
} = {} as any;

beforeEach(async () => {
  context.ethers = hre.artifacts;
  const provider = getProvider(Chain.Ethereum, "http://127.0.0.1:8545/");
  const signer = (await hre.ethers.getImpersonatedSigner(testAddress)) as unknown as JsonRpcSigner;
  context.provider = provider;
  context.toolbox = ETHToolbox({ apiKey: "freekey", provider, signer });
});

afterEach(async () => {
  await helpers.reset(hre.config.networks.hardhat.forking?.url, block?.number);
});

describe("Ethereum toolkit", () => {
  test.todo(
    "Get Balances",
    async () => {
      const balances = await context.toolbox.getBalance(testAddress);
      expect(balances.find((balance) => balance.symbol === "ETH")?.getBaseValue("string")).toBe(
        "20526000000000000",
      );
      expect(
        balances
          .find(
            (balance) =>
              balance.symbol.toLowerCase() ===
              "USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".toLowerCase(),
          )
          ?.getBaseValue("string"),
      ).toBe("6656178");
    },
    10000,
  );

  test.todo(
    "Send ETH",
    async () => {
      expect((await context.provider.getBalance(emptyRecipient)).toString()).toBe("0");
      await context.toolbox.transfer({
        recipient: emptyRecipient,
        assetValue: await AssetValue.from({ chain: Chain.Ethereum, value: "0.010526" }),
        from: testAddress,
      });
      expect((await context.provider.getBalance(emptyRecipient)).toString()).toBe(
        "10526000000000000",
      );
    },
    10000,
  );

  test.todo(
    "Send Token",
    async () => {
      const USDC = await context.toolbox.createContract(USDCAddress, erc20ABI, context.provider);
      const balance = await USDC.balanceOf?.(emptyRecipient);
      expect(balance.toString()).toBe("0");
      await context.toolbox.transfer({
        recipient: emptyRecipient,
        assetValue: await AssetValue.from({
          asset: "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          value: "1",
        }),
        from: testAddress,
      });
      // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
      expect((await USDC.balanceOf?.(emptyRecipient)).toString()).toBe("1000000");
    },
    10000,
  );

  test.todo(
    "Approve Token and validate approved amount",
    async () => {
      expect(
        await context.toolbox.isApproved({
          assetAddress: USDCAddress,
          spenderAddress: emptyRecipient,
          from: testAddress,
          amount: "1000000",
        }),
      ).toBe(false);
      await context.toolbox.approve({
        assetAddress: USDCAddress,
        spenderAddress: emptyRecipient,
        amount: "1000000",
        from: testAddress,
      });

      expect(
        await context.toolbox.isApproved({
          assetAddress: USDCAddress,
          spenderAddress: emptyRecipient,
          from: testAddress,
          amount: "1000000",
        }),
      ).toBe(true);
    },
    10000,
  );

  test.todo(
    "Create contract tx object and sendTransaction",
    async () => {
      const USDC = await context.toolbox.createContract(USDCAddress, erc20ABI, context.provider);
      const balance = await USDC.balanceOf?.(emptyRecipient);
      expect(balance.toString()).toBe("0");

      const txObject = await context.toolbox.createContractTxObject({
        contractAddress: USDCAddress,
        abi: erc20ABI,
        funcName: "transfer",
        funcParams: [emptyRecipient, BigInt("2222222")],
        txOverrides: {
          from: testAddress,
        },
      });

      await context.toolbox.sendTransaction(txObject, FeeOption.Average);
      // biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
      expect((await USDC?.balanceOf?.(emptyRecipient)).toString()).toBe("2222222");
    },
    10000,
  );
});
