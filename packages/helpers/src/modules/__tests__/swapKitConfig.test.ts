import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/types";
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
});
