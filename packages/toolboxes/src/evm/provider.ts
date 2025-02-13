import { type EVMChain, SKConfig } from "@swapkit/helpers";
import { JsonRpcProvider } from "ethers";

export const getProvider = (chain: EVMChain, customUrl?: string) => {
  return new JsonRpcProvider(customUrl || SKConfig.get("rpcUrls")[chain]);
};
