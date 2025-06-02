import { type Chain, type ChainId, ChainIdToChain, RequestClient } from "@swapkit/helpers";

type SwapkitBalanceResponse = {
  chain: Chain;
  decimal: number;
  ticker: string;
  symbol: string;
  value: string;
  identifier: string;
}[];

export const swapkitApi = ({ apiKey, chainId }: { apiKey: string; chainId: ChainId }) => ({
  getBalance: async (address: string, _chainId: ChainId) => {
    const json = await RequestClient.get<SwapkitBalanceResponse>(
      `https://api.swapkit.dev/balance?address=${address}&chain=${ChainIdToChain[chainId]}`,
      { headers: { "x-api-key": apiKey } },
    );

    return (json || []).map(({ identifier, decimal, value }) => ({
      value,
      decimal: decimal,
      chain: ChainIdToChain[chainId],
      symbol: identifier.split(".")[1] as string,
    }));
  },
});

export type SwapkitApiType = ReturnType<typeof swapkitApi>;
