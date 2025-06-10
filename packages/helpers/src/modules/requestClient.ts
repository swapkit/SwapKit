import { SKConfig } from "./swapKitConfig";
import { SwapKitError } from "./swapKitError";

type Options = RequestInit & {
  /**
   * @deprecated Use onSuccess instead - will be removed in next major @MarkedV4
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

    const isJson = !!json || url.endsWith(".json");
    const bodyToSend = isJson ? JSON.stringify(json) : body;

    try {
      const requestUrl = buildUrl(url, searchParams);
      const headers = buildHeaders(isJson, headersOptions);

      const response = await fetch(requestUrl, { ...options, method, body: bodyToSend, headers });

      if (!response.ok) {
        const message = await response.text();
        throw new SwapKitError("helpers_invalid_response", {
          status: response.status,
          statusText: response.statusText,
          message,
        });
      }

      const body = await response.json();

      return options.onSuccess?.(body) || options.responseHandler?.(body) || body;
    } catch (error) {
      if (options.onError) {
        return options.onError(error);
      }
      throw error;
    }
  };
}

function buildHeaders(isJson: boolean, headersOptions?: HeadersInit) {
  const { swapKit } = SKConfig.get("apiKeys");

  return {
    ...headersOptions,
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(swapKit ? { "x-api-key": swapKit } : {}),
  };
}

function buildUrl(url: string, searchParams?: Record<string, string>) {
  const urlInstance = new URL(url);

  if (searchParams) {
    urlInstance.search = new URLSearchParams(searchParams).toString();
  }

  return urlInstance.toString();
}
