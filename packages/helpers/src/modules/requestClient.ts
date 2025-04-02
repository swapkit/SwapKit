import { SKConfig } from "./swapKitConfig";

type Options = RequestInit & {
  /**
   * @deprecated Use onSuccess instead
   */
  responseHandler?: (response: any) => any;
  json?: unknown;
  onError?: (error: any) => any;
  onSuccess?: (response: any) => any;
  searchParams?: Record<string, string>;
};

export const RequestClient = {
  get: fetchWithConfig("GET"),
  post: fetchWithConfig("POST"),
  extend: (extendOptions: Options) => ({
    get: fetchWithConfig("GET", extendOptions),
    post: fetchWithConfig("POST", extendOptions),
    extend: (newOptions: Options) => RequestClient.extend({ ...extendOptions, ...newOptions }),
  }),
};

function fetchWithConfig(method: "GET" | "POST", extendOptions: Options = {}) {
  return async <T>(url: string, options: Options = {}): Promise<T> => {
    const { searchParams, json, body, headers: headersOptions } = { ...extendOptions, ...options };
    const { swapKit } = SKConfig.get("apiKeys");

    const isJson = json || url.endsWith(".json");
    const bodyToSend = isJson ? JSON.stringify(json) : body;
    const urlInstance = new URL(url);

    if (searchParams) {
      urlInstance.search = new URLSearchParams(searchParams).toString();
    }

    const headers = {
      ...headersOptions,
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...(swapKit ? { "x-api-key": swapKit } : {}),
    };

    try {
      const response = await fetch(urlInstance.toString(), {
        ...options,
        method,
        body: bodyToSend,
        headers,
      });

      const body = await response.json();

      return options.onSuccess?.(body) || options.responseHandler?.(body) || body;
    } catch (error) {
      return options.onError?.(error) || console.error(error);
    }
  };
}
