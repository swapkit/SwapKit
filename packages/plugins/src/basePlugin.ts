import type { SwapKitPluginParams } from "@swapkit/helpers";

export function createPlugin<
  T extends Record<string, (params: SwapKitPluginParams) => unknown>,
  K extends {},
>(methods: T, values?: K) {
  return function plugin(pluginParams: SwapKitPluginParams) {
    const wrappedMethods = Object.keys(methods).reduce(
      (acc, key) => {
        const method = methods[key as keyof T];
        if (method && typeof method === "function") {
          (acc as any)[key] = method(pluginParams);
        }
        return acc;
      },
      {} as { [K in keyof T]: ReturnType<T[K]> },
    );

    return { ...wrappedMethods, ...values } as { [K in keyof T]: ReturnType<T[K]> } & K;
  };
}
