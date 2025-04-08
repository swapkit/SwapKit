import { type EVMChain, SKConfig, warnOnce } from "@swapkit/helpers";
import { getBalance } from "../utils";

export function getEvmApi(chain: EVMChain) {
  const customEvmApi = SKConfig.get("apis")[chain];

  if (customEvmApi) {
    warnOnce(true, "Using custom EVM API. Be sure to implement all methods to avoid issues.");
    return customEvmApi as ReturnType<typeof evmApi>;
  }

  return evmApi(chain);
}

export function createCustomEvmApi(methods: ReturnType<typeof getEvmApi>) {
  return methods;
}

function evmApi(chain: EVMChain) {
  return { getBalance: getBalance(chain) };
}
