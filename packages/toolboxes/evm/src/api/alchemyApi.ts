import {
  BaseDecimal,
  type Chain,
  ChainId,
  ChainIdToChain,
  type EVMChain,
  EVMChains,
  RequestClient,
  type TokenTax,
  formatBigIntToSafeValue,
} from "@swapkit/helpers";

const ChainIdToAlchemyNetwork: Partial<Record<ChainId, string>> = {
  [ChainId.Arbitrum]: "arb",
  [ChainId.Avalanche]: "avax",
  [ChainId.Base]: "base",
  [ChainId.BinanceSmartChain]: "bnb",
  [ChainId.Ethereum]: "eth",
  [ChainId.Optimism]: "opt",
  [ChainId.Polygon]: "polygon",
};

const staticTokensMap = new Map<string, { tax?: TokenTax; decimal: number; symbol: string }>();

import("@swapkit/tokens").then((tokenPackage) => {
  for (const tokenList of Object.values(tokenPackage.tokenLists).filter(
    (tokenList) => !["CAVIAR_V1", "JUPITER"].includes(tokenList.provider),
  )) {
    for (const { identifier, chain, ...rest } of tokenList.tokens) {
      // @ts-expect-error
      if (EVMChains.includes(chain as EVMChain) && !!rest.address) {
        //@ts-expect-error
        staticTokensMap.set(rest.address.toUpperCase(), {
          symbol: identifier.split(".").slice(1).join("."),
          decimal: "decimals" in rest ? rest.decimals : BaseDecimal[chain as EVMChain],
        });
      }
    }
  }
});

export const alchemyApi = ({ apiKey }: { apiKey: string; chainId: ChainId }) => {
  return {
    getBalance: async (address: string, chainId: ChainId) => {
      const alchemyNetwork = ChainIdToAlchemyNetwork[chainId];

      if (!alchemyNetwork) {
        throw new Error(`Chain ${ChainIdToChain[chainId]} is not supported by Alchemy`);
      }

      const res = await RequestClient.post<{
        id: number;
        result: {
          address: string;
          tokenBalances: {
            contractAddress: string;
            tokenBalance: string;
          }[];
          pageKey: string;
        };
      }>(`https://${ChainIdToAlchemyNetwork[chainId]}-mainnet.g.alchemy.com/v2/${apiKey}`, {
        json: {
          jsonrpc: "2.0",
          method: "alchemy_getTokenBalances",
          params: [address, "erc20"],
        },
      });

      const balances = res.result.tokenBalances
        .map(({ contractAddress, tokenBalance }) => {
          const assetData = staticTokensMap.get(contractAddress.toUpperCase());
          if (assetData) {
            return {
              value: formatBigIntToSafeValue({
                value: BigInt(tokenBalance),
                decimal: assetData.decimal,
                bigIntDecimal: assetData.decimal,
              }),
              decimal: assetData.decimal,
              chain: ChainIdToChain[chainId],
              symbol: assetData.symbol,
            };
          }
          return;
        })
        .filter(Boolean) as { chain: Chain; symbol: string; value: string; decimal: number }[];

      return balances || [];
    },
  };
};

export type AlchemyApiType = ReturnType<typeof alchemyApi>;
