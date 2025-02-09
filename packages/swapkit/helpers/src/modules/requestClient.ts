type Options = Parameters<typeof fetch>[1] & {
  headers?: Record<string, string>;
  apiKey?: string;
  onError?: (error: any) => any;
  responseHandler?: (response: any) => any;
  searchParams?: Record<string, string>;
  json?: unknown;
};

let clientConfig: Options = {};

export const defaultRequestHeaders =
  typeof window !== "undefined"
    ? ({} as Record<string, string>)
    : { referrer: "https://sk.thorswap.net", referer: "https://sk.thorswap.net" };

export function setRequestClientConfig({ apiKey, ...config }: Options) {
  clientConfig = { ...config, apiKey };
}

async function fetchWithConfig(
  { url, method }: { url: string; method: "GET" | "POST" },
  options: Options = {},
) {
  const { searchParams, json, body } = options;
  const urlInstance = new URL(url);
  const bodyToSend = json ? JSON.stringify(json) : body;

  const headers = {
    ...defaultRequestHeaders,
    ...clientConfig.headers,
    ...options.headers,
    ...(json ? { "Content-Type": "application/json" } : {}),
  } as Record<string, string>;

  if (searchParams) {
    urlInstance.search = new URLSearchParams(searchParams).toString();
  }
  if (clientConfig.apiKey) {
    headers["x-api-key"] = clientConfig.apiKey;
  }

  try {
    const response = await fetch(urlInstance.toString(), {
      ...clientConfig,
      ...options,
      method,
      body: bodyToSend,
      headers,
    });
    const body = await response.json();

    return options.responseHandler?.(body) || body;
  } catch (error) {
    return options.onError?.(error) || console.error(error);
  }
}

export const RequestClient = {
  get: async <T>(url: string, options?: Options): Promise<T> =>
    fetchWithConfig({ url, method: "GET" }, options),
  post: async <T>(url: string, options?: Options): Promise<T> =>
    fetchWithConfig({ url, method: "POST" }, options),
  extend: (extendOptions: Options) => ({
    get: async <T>(url: string, options?: Options): Promise<T> =>
      fetchWithConfig({ url, method: "GET" }, { ...extendOptions, ...options }),
    post: async <T>(url: string, options?: Options): Promise<T> =>
      fetchWithConfig({ url, method: "POST" }, { ...extendOptions, ...options }),
    extend: (newOptions: Options) => RequestClient.extend({ ...extendOptions, ...newOptions }),
  }),
};
