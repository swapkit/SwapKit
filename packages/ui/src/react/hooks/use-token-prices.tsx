import { SwapKitApi, type Token } from "@swapkit/sdk";
import { useCallback, useMemo } from "react";
import { create } from "zustand";

type TokenPrice = { identifier: Token["identifier"]; priceUSD: number };

const useTokenPricesStore = create<{
  pricesByTokenId: Map<TokenPrice["identifier"], TokenPrice>;
  setTokenPrices: (tokenPrices: TokenPrice[]) => void;
  isFetchingTokenPrices: boolean;
  setIsFetchingTokenPrices: (isFetchingTokenPrices: boolean) => void;
}>((set) => {
  return {
    isFetchingTokenPrices: false,
    pricesByTokenId: new Map(),
    setIsFetchingTokenPrices: (isFetchingTokenPrices: boolean) => set({ isFetchingTokenPrices }),
    setTokenPrices: (tokenPrices: TokenPrice[]) =>
      set((state) => {
        const newPricesByTokenId = new Map(state.pricesByTokenId);

        tokenPrices?.forEach((tokenPrice) => {
          newPricesByTokenId.set(tokenPrice?.identifier, tokenPrice);
        });

        return { pricesByTokenId: newPricesByTokenId };
      }),
  };
});

export const useTokenPrices = () => {
  const { pricesByTokenId, setTokenPrices, isFetchingTokenPrices, setIsFetchingTokenPrices } = useTokenPricesStore(
    (state) => state,
  );

  const fetchTokenPrices = useCallback(
    async (tokenIds: Token["identifier"][]) => {
      setIsFetchingTokenPrices(true);
      try {
        const getPriceInput = tokenIds.map((tokenId) => ({ identifier: tokenId }));

        const tokenPrices = await SwapKitApi.getPrice({ metadata: false, tokens: getPriceInput });

        const extractedTokenPrices = tokenPrices
          .filter((tokenPrice) => tokenPrice?.identifier && tokenPrice?.price_usd)
          .map((tokenPrice) => ({
            identifier: tokenPrice?.identifier as Token["identifier"],
            priceUSD: tokenPrice?.price_usd ?? 0,
          }));

        setTokenPrices?.(extractedTokenPrices);
      } catch (error) {
        console.error("Failed to fetch token prices:", error);
      } finally {
        setIsFetchingTokenPrices(false);
      }
    },
    [setTokenPrices, setIsFetchingTokenPrices],
  );

  return useMemo(
    () => ({ fetchTokenPrices, isFetchingTokenPrices, pricesByTokenId, setTokenPrices }),
    [fetchTokenPrices, isFetchingTokenPrices, pricesByTokenId, setTokenPrices],
  );
};
