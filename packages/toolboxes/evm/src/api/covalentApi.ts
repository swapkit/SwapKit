import {
  type ChainId,
  ChainIdToChain,
  RequestClient,
  formatBigIntToSafeValue,
} from "@swapkit/helpers";

type CovalentBalanceResponse = {
  address: string;
  updated_at: string;
  next_updated_at: string;
  quote_currency: string;
  items: {
    is_spam: boolean;
    contract_decimals: number;
    contract_name: string;
    contract_ticker_symbol: string;
    contract_address: string;
    logo_url: string;
    last_transferred_at: string;
    native_token: boolean;
    type: string;
    balance: number;
    balance_24h: number;
    quote_rate: number;
    quote_rate_24h: number;
    quote: number;
    quote_24h: number;
  }[];
};

export const covalentApi = ({ apiKey, chainId }: { apiKey: string; chainId: ChainId }) => ({
  getBalance: async (address: string, _chainId: ChainId) => {
    const { data } = await RequestClient.get<{ data: CovalentBalanceResponse }>(
      `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/`,
      { searchParams: { key: apiKey } },
    );

    return (data?.items || [])
      .filter(({ is_spam }) => !is_spam)
      .map(
        ({
          balance,
          contract_decimals,
          contract_ticker_symbol,
          contract_address,
          native_token,
        }) => ({
          value: formatBigIntToSafeValue({
            value: BigInt(balance),
            decimal: contract_decimals,
            bigIntDecimal: contract_decimals,
          }),
          decimal: contract_decimals,
          chain: ChainIdToChain[chainId],
          symbol: `${contract_ticker_symbol || "Unknown"}${native_token ? "" : `-${contract_address}`}`,
        }),
      );
  },
});

export type CovalentApiType = ReturnType<typeof covalentApi>;
