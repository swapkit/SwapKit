import { describe, expect, test } from "bun:test";
import { Chain, CosmosChains, EVMChains, getChainConfig, UTXOChains } from "@swapkit/helpers";
import { getExplorerAddressUrl, getExplorerTxUrl } from "../explorerUrls";

describe("Explorer URLs", () => {
  describe("CosmosChains", () => {
    for (const chain of CosmosChains) {
      test(`getExplorerTxUrl returns correct URL for ${chain}`, () => {
        expect(getExplorerTxUrl({ chain, txHash: "0x123456789" })).toBe(
          `${getChainConfig(chain).blockExplorerUrl}/tx/123456789`,
        );

        expect(getExplorerAddressUrl({ address: "asdfg", chain })).toBe(
          `${getChainConfig(chain).blockExplorerUrl}/address/asdfg`,
        );
      });
    }
  });

  describe("EVMChains & SubstrateChains", () => {
    for (const chain of [...EVMChains, Chain.Polkadot]) {
      test(`getExplorerTxUrl returns correct URL for ${chain}`, () => {
        expect(getExplorerTxUrl({ chain, txHash: "0x123456789" })).toBe(
          `${getChainConfig(chain).blockExplorerUrl}/tx/0x123456789`,
        );

        expect(getExplorerAddressUrl({ address: "asdfg", chain })).toBe(
          `${getChainConfig(chain).blockExplorerUrl}/address/asdfg`,
        );
      });
    }

    test("getExplorerTxUrl adds 0x for EVM like chains", () => {
      expect(getExplorerTxUrl({ chain: Chain.Ethereum, txHash: "12345" })).toBe("https://etherscan.io/tx/0x12345");
    });
  });

  describe("UTXOChains", () => {
    for (const chain of UTXOChains.filter((c) => c !== Chain.Dash)) {
      test(`getExplorerTxUrl returns correct URL for ${chain}`, () => {
        expect(getExplorerTxUrl({ chain, txHash: "0x123456789" })).toBe(
          `${getChainConfig(chain).blockExplorerUrl}/transaction/0x123456789`,
        );

        expect(getExplorerAddressUrl({ address: "asdfg", chain })).toBe(
          `${getChainConfig(chain).blockExplorerUrl}/address/asdfg`,
        );
      });
    }
  });

  describe("Solana", () => {
    test("getExplorerTxUrl returns correct URL for Solana", () => {
      expect(getExplorerTxUrl({ chain: Chain.Solana, txHash: "b123456789" })).toBe("https://solscan.io/tx/b123456789");

      expect(getExplorerAddressUrl({ address: "asdfg", chain: Chain.Solana })).toBe("https://solscan.io/account/asdfg");
    });
  });
});
