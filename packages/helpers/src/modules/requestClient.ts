import { SKConfig } from "./swapKitConfig";
import { SwapKitError } from "./swapKitError";

type Options = Parameters<typeof fetch>[1] & {
  headers?: Record<string, string>;
  apiKey?: string;
  onError?: (error: any) => any;
  responseHandler?: (response: any) => any;
  searchParams?: Record<string, string>;
  json?: unknown;
};

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

async function fetchWithConfig(
  { url, method }: { url: string; method: "GET" | "POST" },
  options: Options = {},
) {
  const { searchParams, json, body } = options;
  const urlInstance = new URL(url);
  const isJson = json || url.endsWith(".json");
  const bodyToSend = isJson ? JSON.stringify(json) : body;

  const hash = await computeHash({ method, url, payload: json });
  const authHeaders = getAuthHeaders(hash);

  const headers = {
    ...options.headers,
    ...authHeaders,
    ...(isJson ? { "Content-Type": "application/json" } : {}),
  } as Record<string, string>;

  if (searchParams) {
    urlInstance.search = new URLSearchParams(searchParams).toString();
  }
  if (SKConfig.get("apiKeys").swapKit) {
    headers["x-api-key"] = SKConfig.get("apiKeys").swapKit;
  }

  try {
    const response = await fetch(urlInstance.toString(), {
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

function getAuthHeaders(hash?: string) {
  const { swapKit } = SKConfig.get("apiKeys");
  const { referer } = SKConfig.get("envs");

  return {
    ...(typeof window !== "undefined"
      ? ({} as Record<string, string>)
      : { referrer: "https://sk.thorswap.net", referer: "https://sk.thorswap.net" }),
    ...(swapKit && !hash ? { "x-api-key": swapKit } : {}),
    ...(hash && referer ? { "x-payload-hash": hash, referer } : {}),
  };
}

export async function computeHash(
  hashParams: { method: "POST"; payload: any } | { method: "GET"; url: string },
) {
  const { createHash } = await import("crypto");
  const { swapKit } = SKConfig.get("apiKeys");
  const { referer } = SKConfig.get("envs");

  if (!(referer && swapKit)) return;

  if (!["POST", "GET"].includes(hashParams.method)) {
    throw new SwapKitError("api_v2_invalid_method_key_hash", {
      message: `Invalid method for params: ${JSON.stringify(hashParams)}`,
    });
  }

  const data =
    hashParams.method === "POST"
      ? JSON.stringify(hashParams.payload)
      : `${hashParams.url}${swapKit}`;

  return createHash("sha256").update(data, "utf8").digest("hex");
}
