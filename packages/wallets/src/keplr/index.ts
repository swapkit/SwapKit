import type { Keplr } from "@keplr-wallet/types";
import {
  type AssetValue,
  Chain,
  ChainId,
  ChainToChainId,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { CosmosToolboxType } from "@swapkit/toolboxes/cosmos";
import { chainRegistry } from "./chainRegistry";

declare global {
  interface Window {
    keplr: Keplr;
    leap: Keplr;
  }
}

const keplrSupportedChainIds = [ChainId.Cosmos, ChainId.Kujira, ChainId.THORChain] as const;

export const keplrWallet = createWallet({
  name: "connectKeplr",
  supportedChains: [Chain.Cosmos, Chain.Kujira, Chain.THORChain],
  connect: ({ addChain, supportedChains }) =>
    async function connectKeplr(
      chains: Chain[],
      walletType: WalletOption.KEPLR | WalletOption.LEAP = WalletOption.KEPLR,
    ) {
      const extensionKey = walletType === WalletOption.LEAP ? "leap" : "keplr";
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });
      const keplrClient = window[extensionKey];

      await Promise.all(
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: refactor/split
        filteredChains.map(async (chain) => {
          const chainId = ChainToChainId[chain] as (typeof keplrSupportedChainIds)[number];

          if (!keplrSupportedChainIds.includes(chainId)) {
            const chainConfig = chainRegistry.get(chainId);
            if (!chainConfig) throw new Error(`Unsupported chain ${chain}`);

            await keplrClient.experimentalSuggestChain(chainConfig);
          }

          keplrClient?.enable(chainId);
          const offlineSigner = keplrClient?.getOfflineSignerOnlyAmino(chainId);
          if (!offlineSigner) throw new Error("Could not load offlineSigner");

          const { getToolboxByChain } = await import("@swapkit/toolboxes/cosmos");

          const accounts = await offlineSigner.getAccounts();
          if (!accounts?.[0]?.address) throw new Error("No accounts found");

          const [{ address }] = accounts;
          const toolbox = getToolboxByChain(chain)();

          const transfer = (params: {
            from?: string;
            recipient: string;
            assetValue: AssetValue;
            memo?: string;
          }) =>
            toolbox.transfer({
              ...params,
              signer: offlineSigner,
              fee: 2,
              from: params.from || address,
            });

          const deposit =
            chain === Chain.THORChain
              ? (params: {
                  from?: string;
                  assetValue: AssetValue;
                  memo?: string;
                }) =>
                  (toolbox as ReturnType<CosmosToolboxType["THOR"]>).deposit({
                    ...params,
                    signer: offlineSigner,
                    from: params.from || address,
                    memo: params.memo || "",
                  })
              : undefined;

          addChain({
            ...toolbox,
            deposit,
            chain,
            transfer,
            address,
            walletType,
          });
        }),
      );

      return true;
    },
});
