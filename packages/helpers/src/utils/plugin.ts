import type { ProviderName, SwapKitPluginParams } from "../types";

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
