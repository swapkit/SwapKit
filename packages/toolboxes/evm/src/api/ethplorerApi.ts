import { Chain, type ChainId, RequestClient, formatBigIntToSafeValue } from "@swapkit/helpers";

import type { AddressInfo } from "../types/ethplorer-api-types";
const baseUrl = "https://api.ethplorer.io";

export const ethplorerApi = (apiKey = "freekey") => ({
  getBalance: async (address: string, _chainId: ChainId) => {
    const { tokens = [] } = await RequestClient.get<AddressInfo>(
      `${baseUrl}/getAddressInfo/${address}`,
      { searchParams: { apiKey } },
    );

    return tokens
      .filter(({ tokenInfo: { symbol }, rawBalance }) => symbol && rawBalance !== "0")
      .map(({ tokenInfo: { symbol, decimals, address: tokenAddress }, rawBalance }) => ({
        chain: Chain.Ethereum,
        symbol: tokenAddress ? `${symbol}-${tokenAddress}` : symbol,
        value: formatBigIntToSafeValue({
          value: BigInt(rawBalance),
          decimal: Number.parseInt(decimals),
          bigIntDecimal: Number.parseInt(decimals),
        }),
        decimal: Number.parseInt(decimals),
      }));
  },
});

export type EthplorerApiType = ReturnType<typeof ethplorerApi>;
