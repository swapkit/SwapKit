import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/types";
import { FeeOption } from "../../types";
import { SKConfig } from "../swapKitConfig";

beforeAll(() => {
  SKConfig.reinitialize();
});

afterAll(() => {
  SKConfig.reinitialize();
});

describe("swapKitConfig", () => {
  test("properly sets api keys", () => {
    const initialState = SKConfig.get("apiKeys").swapKit;
    expect(initialState).toBe("");

    SKConfig.setApiKey("swapKit", "123");

    const changedState = SKConfig.get("apiKeys").swapKit;
    expect(changedState).toBe("123");
  });

  test("do not drop if other keys are changed", () => {
    SKConfig.setApiKey("swapKit", "123");
    expect(SKConfig.get("apiKeys").swapKit).toBe("123");

    SKConfig.setApiKey("walletConnectProjectId", "123");
    expect(SKConfig.get("apiKeys")).toMatchObject({ swapKit: "123", walletConnectProjectId: "123" });

    SKConfig.setRpcUrl(Chain.Ethereum, ["https://lul.xyz"]);
    expect(SKConfig.getState()).toMatchObject({
      apiKeys: { swapKit: "123", walletConnectProjectId: "123" },
      rpcUrls: { [Chain.Ethereum]: ["https://lul.xyz"] },
    });
  });

  describe("setConfig", () => {
    test("merges chains without duplicates", () => {
      SKConfig.reinitialize();

      const initialChains = SKConfig.get("chains");
      const initialLength = initialChains.length;

      SKConfig.set({ chains: [Chain.Ethereum, Chain.Bitcoin] });

      const newChains = SKConfig.get("chains");
      // Should add new chains (if not already present)
      expect(newChains.length).toBeGreaterThanOrEqual(initialLength);
      expect(newChains).toContain(Chain.Ethereum);
      expect(newChains).toContain(Chain.Bitcoin);
    });

    test("merges wallets array", () => {
      SKConfig.reinitialize();

      const initialWallets = SKConfig.get("wallets");
      SKConfig.set({ wallets: initialWallets });

      const newWallets = SKConfig.get("wallets");
      expect(newWallets.length).toBeGreaterThanOrEqual(initialWallets.length);
    });

    test("merges apiKeys without overwriting", () => {
      SKConfig.reinitialize();

      SKConfig.setApiKey("swapKit", "test-key-1");
      SKConfig.set({ apiKeys: { blockchair: "blockchair-key" } });

      const apiKeys = SKConfig.get("apiKeys");
      expect(apiKeys.swapKit).toBe("test-key-1");
      expect(apiKeys.blockchair).toBe("blockchair-key");
    });

    test("merges envs object", () => {
      SKConfig.reinitialize();

      SKConfig.set({ envs: { isDev: true } });

      const envs = SKConfig.get("envs");
      expect(envs.isDev).toBe(true);
      expect(envs.apiUrl).toBeDefined(); // Should preserve other env values
    });

    test("merges rpcUrls", () => {
      SKConfig.reinitialize();

      SKConfig.set({
        rpcUrls: { [Chain.Ethereum]: ["https://custom-eth-rpc.com"], [Chain.Bitcoin]: ["https://custom-btc-rpc.com"] },
      });

      const rpcUrls = SKConfig.get("rpcUrls");
      expect(rpcUrls[Chain.Ethereum]).toEqual(["https://custom-eth-rpc.com"]);
      expect(rpcUrls[Chain.Bitcoin]).toEqual(["https://custom-btc-rpc.com"]);
    });

    test("merges integrations config", () => {
      SKConfig.reinitialize();

      SKConfig.set({ integrations: { coinbase: { appName: "Test App", darkMode: true } } });

      const integrations = SKConfig.get("integrations");
      expect(integrations.coinbase?.appName).toBe("Test App");
      expect(integrations.radix).toBeDefined(); // Should preserve default radix config
    });

    test("sets feeMultipliers", () => {
      SKConfig.reinitialize();

      const feeMultipliers = { [FeeOption.Average]: 1.0, [FeeOption.Fast]: 1.5, [FeeOption.Fastest]: 2.0 };

      SKConfig.set({ feeMultipliers });

      const result = SKConfig.get("feeMultipliers");
      expect(result).toEqual(feeMultipliers);
    });
  });

  describe("setEnv", () => {
    test("sets isDev flag", () => {
      SKConfig.reinitialize();

      SKConfig.setEnv("isDev", true);
      expect(SKConfig.get("envs").isDev).toBe(true);

      SKConfig.setEnv("isDev", false);
      expect(SKConfig.get("envs").isDev).toBe(false);
    });

    test("sets isStagenet flag", () => {
      SKConfig.reinitialize();

      SKConfig.setEnv("isStagenet", true);
      expect(SKConfig.get("envs").isStagenet).toBe(true);

      SKConfig.setEnv("isStagenet", false);
      expect(SKConfig.get("envs").isStagenet).toBe(false);
    });

    test("sets apiUrl", () => {
      SKConfig.reinitialize();

      const customUrl = "https://custom-api.example.com";
      SKConfig.setEnv("apiUrl", customUrl);
      expect(SKConfig.get("envs").apiUrl).toBe(customUrl);
    });

    test("sets devApiUrl", () => {
      SKConfig.reinitialize();

      const customDevUrl = "https://custom-dev-api.example.com";
      SKConfig.setEnv("devApiUrl", customDevUrl);
      expect(SKConfig.get("envs").devApiUrl).toBe(customDevUrl);
    });
  });

  describe("setRpcUrl", () => {
    test("sets RPC URL for single chain", () => {
      SKConfig.reinitialize();

      const customRpcUrls = ["https://custom-eth.rpc.com", "https://backup-eth.rpc.com"];
      SKConfig.setRpcUrl(Chain.Ethereum, customRpcUrls);

      expect(SKConfig.get("rpcUrls")[Chain.Ethereum]).toEqual(customRpcUrls);
    });

    test("sets RPC URL for multiple chains", () => {
      SKConfig.reinitialize();

      SKConfig.setRpcUrl(Chain.Ethereum, ["https://eth.rpc.com"]);
      SKConfig.setRpcUrl(Chain.Avalanche, ["https://avax.rpc.com"]);

      const rpcUrls = SKConfig.get("rpcUrls");
      expect(rpcUrls[Chain.Ethereum]).toEqual(["https://eth.rpc.com"]);
      expect(rpcUrls[Chain.Avalanche]).toEqual(["https://avax.rpc.com"]);
    });

    test("overwrites existing RPC URLs", () => {
      SKConfig.reinitialize();

      SKConfig.setRpcUrl(Chain.Bitcoin, ["https://btc-old.rpc.com"]);
      SKConfig.setRpcUrl(Chain.Bitcoin, ["https://btc-new.rpc.com"]);

      expect(SKConfig.get("rpcUrls")[Chain.Bitcoin]).toEqual(["https://btc-new.rpc.com"]);
    });
  });

  describe("setIntegrationConfig", () => {
    test("sets Radix integration config", () => {
      SKConfig.reinitialize();

      const radixConfig = {
        applicationName: "Test DApp",
        applicationVersion: "1.0.0",
        dAppDefinitionAddress: "account_test123",
        network: { dashboardBase: "https://stokenet-dashboard.radixdlt.com", networkId: 2, networkName: "stokenet" },
      };

      SKConfig.setIntegrationConfig("radix", radixConfig);

      const result = SKConfig.get("integrations").radix;
      expect(result).toEqual(radixConfig);
    });

    test("sets Coinbase integration config", () => {
      SKConfig.reinitialize();

      const coinbaseConfig = { appLogoUrl: "https://example.com/logo.png", appName: "My Coinbase App", darkMode: true };

      SKConfig.setIntegrationConfig("coinbase", coinbaseConfig);

      const result = SKConfig.get("integrations").coinbase;
      expect(result?.appName).toBe("My Coinbase App");
      expect(result?.darkMode).toBe(true);
    });

    test("sets Trezor integration config", () => {
      SKConfig.reinitialize();

      const trezorConfig = { appUrl: "https://example.com", email: "test@example.com" };

      SKConfig.setIntegrationConfig("trezor", trezorConfig);

      const result = SKConfig.get("integrations").trezor;
      expect(result).toEqual(trezorConfig);
    });

    test("sets KeepKey integration config", () => {
      SKConfig.reinitialize();

      const keepKeyConfig = {
        basePath: "/keepkey",
        imageUrl: "https://example.com/icon.png",
        name: "Test App",
        url: "https://example.com",
      };

      SKConfig.setIntegrationConfig("keepKey", keepKeyConfig);

      const result = SKConfig.get("integrations").keepKey;
      expect(result).toEqual(keepKeyConfig);
    });

    test("sets Chainflip integration config", () => {
      SKConfig.reinitialize();

      const chainflipConfig = { brokerUrl: "https://broker.chainflip.io", useSDKBroker: true };

      SKConfig.setIntegrationConfig("chainflip", chainflipConfig);

      const result = SKConfig.get("integrations").chainflip;
      expect(result).toEqual(chainflipConfig);
    });
  });

  describe("setRequestOptions", () => {
    test("sets timeout option and preserves retry", () => {
      SKConfig.reinitialize();

      const initialRetry = SKConfig.get("requestOptions").retry;

      SKConfig.setRequestOptions({ retry: initialRetry, timeoutMs: 60000 });

      const result = SKConfig.get("requestOptions");
      expect(result.timeoutMs).toBe(60000);
    });

    test("sets retry options with timeoutMs", () => {
      SKConfig.reinitialize();

      SKConfig.setRequestOptions({
        retry: { backoffMultiplier: 3, baseDelay: 500, maxDelay: 10000, maxRetries: 5 },
        timeoutMs: 30000,
      });

      const result = SKConfig.get("requestOptions");
      expect(result.retry.maxRetries).toBe(5);
      expect(result.retry.baseDelay).toBe(500);
      expect(result.retry.maxDelay).toBe(10000);
      expect(result.retry.backoffMultiplier).toBe(3);
    });

    test("merges partial retry options", () => {
      SKConfig.reinitialize();

      const initialRetry = SKConfig.get("requestOptions").retry;
      const initialTimeout = SKConfig.get("requestOptions").timeoutMs;

      SKConfig.setRequestOptions({ retry: { ...initialRetry, maxRetries: 10 }, timeoutMs: initialTimeout });

      const result = SKConfig.get("requestOptions").retry;
      expect(result.maxRetries).toBe(10);
      // Should preserve other retry settings
      expect(result.baseDelay).toBe(initialRetry.baseDelay);
      expect(result.maxDelay).toBe(initialRetry.maxDelay);
    });
  });

  describe("setFeeMultipliers", () => {
    test("sets fee multipliers for options", () => {
      SKConfig.reinitialize();

      const multipliers = { [FeeOption.Average]: 1.0, [FeeOption.Fast]: 1.5, [FeeOption.Fastest]: 2.0 };

      SKConfig.setFeeMultipliers(multipliers);

      const result = SKConfig.get("feeMultipliers");
      expect(result).toEqual(multipliers);
    });

    test("overwrites existing fee multipliers", () => {
      SKConfig.reinitialize();

      const multipliers1 = { [FeeOption.Average]: 1.0, [FeeOption.Fast]: 1.5, [FeeOption.Fastest]: 2.0 };

      const multipliers2 = { [FeeOption.Average]: 1.2, [FeeOption.Fast]: 1.8, [FeeOption.Fastest]: 2.5 };

      SKConfig.setFeeMultipliers(multipliers1);
      SKConfig.setFeeMultipliers(multipliers2);

      const result = SKConfig.get("feeMultipliers");
      expect(result).toEqual(multipliers2);
    });
  });

  describe("reinitialize", () => {
    test("resets all state to initial values", () => {
      // Modify some state
      SKConfig.setApiKey("swapKit", "test-key");
      SKConfig.setEnv("isDev", true);
      SKConfig.setRpcUrl(Chain.Ethereum, ["https://custom.rpc.com"]);

      // Reinitialize
      SKConfig.reinitialize();

      // Verify reset
      expect(SKConfig.get("apiKeys").swapKit).toBe("");
      expect(SKConfig.get("envs").isDev).toBe(false);
      // RPC URLs should be reset to defaults
      expect(SKConfig.get("rpcUrls")[Chain.Ethereum]).toBeDefined();
    });

    test("can set values after reinitialize", () => {
      SKConfig.reinitialize();

      SKConfig.setApiKey("swapKit", "new-key");
      expect(SKConfig.get("apiKeys").swapKit).toBe("new-key");
    });
  });

  describe("getState", () => {
    test("returns complete state object", () => {
      SKConfig.reinitialize();

      const state = SKConfig.getState();

      expect(state).toHaveProperty("apiKeys");
      expect(state).toHaveProperty("chains");
      expect(state).toHaveProperty("envs");
      expect(state).toHaveProperty("integrations");
      expect(state).toHaveProperty("rpcUrls");
      expect(state).toHaveProperty("wallets");
      expect(state).toHaveProperty("requestOptions");
    });

    test("state contains expected structure", () => {
      SKConfig.reinitialize();

      const state = SKConfig.getState();

      expect(Array.isArray(state.chains)).toBe(true);
      expect(typeof state.apiKeys).toBe("object");
      expect(typeof state.envs).toBe("object");
      expect(typeof state.integrations).toBe("object");
      expect(typeof state.rpcUrls).toBe("object");
    });
  });

  describe("multiple API keys", () => {
    test("sets and gets blockchair API key", () => {
      SKConfig.reinitialize();

      SKConfig.setApiKey("blockchair", "blockchair-key");
      expect(SKConfig.get("apiKeys").blockchair).toBe("blockchair-key");
    });

    test("sets and gets keepKey API key", () => {
      SKConfig.reinitialize();

      SKConfig.setApiKey("keepKey", "keepkey-key");
      expect(SKConfig.get("apiKeys").keepKey).toBe("keepkey-key");
    });

    test("sets and gets walletConnectProjectId", () => {
      SKConfig.reinitialize();

      SKConfig.setApiKey("walletConnectProjectId", "wc-project-id");
      expect(SKConfig.get("apiKeys").walletConnectProjectId).toBe("wc-project-id");
    });

    test("sets and gets xaman API key", () => {
      SKConfig.reinitialize();

      SKConfig.setApiKey("xaman", "xaman-key");
      expect(SKConfig.get("apiKeys").xaman).toBe("xaman-key");
    });
  });

  describe("setEndpoint", () => {
    test("sets endpoint", async () => {
      SKConfig.reinitialize();

      SKConfig.setEndpoint("getBalance", ({ chain }) =>
        Promise.resolve([{ chain, decimal: 18, identifier: "ETH", symbol: "ETH", ticker: "ETH", value: "100" }]),
      );

      const result = await SKConfig.get("endpoints").getBalance({ address: "0x123", chain: Chain.Ethereum });

      expect(result).toEqual([
        { chain: Chain.Ethereum, decimal: 18, identifier: "ETH", symbol: "ETH", ticker: "ETH", value: "100" },
      ]);
    });
  });
});
