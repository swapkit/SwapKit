import type { PluginName, SKPlugins } from "./types";

export * from "./types";
export * from "./utils";

export async function loadPlugin<P extends PluginName>(pluginName: P) {
  const { match } = await import("ts-pattern");

  const plugin = await match(pluginName as PluginName)
    .with("chainflip", async () => {
      const { ChainflipPlugin } = await import("./chainflip");
      return ChainflipPlugin;
    })
    .with("thorchain", async () => {
      const { ThorchainPlugin } = await import("./thorchain");
      return ThorchainPlugin;
    })
    .with("radix", async () => {
      const { RadixPlugin } = await import("./radix");
      return RadixPlugin;
    })
    .with("evm", async () => {
      const { EVMPlugin } = await import("./evm");
      return EVMPlugin;
    })
    .with("solana", async () => {
      const { SolanaPlugin } = await import("./solana");
      return SolanaPlugin;
    })
    .with("near", async () => {
      const { NearPlugin } = await import("./near");
      return NearPlugin;
    })
    .exhaustive();

  return plugin as unknown as SKPlugins[P];
}
