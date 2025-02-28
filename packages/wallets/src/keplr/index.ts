import {
  Chain,
  ChainId,
  ChainToChainId,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import { chainRegistry } from "./chainRegistry";

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
          const toolbox = getToolboxByChain(chain)(offlineSigner);

          addChain({
            ...toolbox,
            chain,
            address,
            walletType,
          });
        }),
      );

      return true;
    },
});
