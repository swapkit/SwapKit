import type { ProviderName } from "@swapkit/helpers";
import type { PluginName, SKPlugins, SwapKitPluginParams } from "./types";

export function createPlugin<
  const Name extends string,
  T extends (params: SwapKitPluginParams) => Record<string, unknown>,
  K extends { supportedSwapkitProviders?: (ProviderName | string)[] },
>({ name, properties, methods }: { name: Name; properties?: K; methods: T }) {
  function plugin(pluginParams: SwapKitPluginParams) {
    return { ...methods(pluginParams), ...properties } as K & ReturnType<T>;
  }

  return { [name]: plugin } as { [key in Name]: typeof plugin };
}

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
    .with("swapkit", async () => {
      const { SwapKitPlugin } = await import("./swapkit");
      return SwapKitPlugin;
    })
    .with("near", async () => {
      const { NearPlugin } = await import("./near");
      return NearPlugin;
    })
    .exhaustive();

  return plugin as unknown as SKPlugins[P];
}
