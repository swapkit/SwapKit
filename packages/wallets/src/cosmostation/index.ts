import {
  Chain,
  ChainId,
  ChainToChainId,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";

const cosmostationSupportedChainIds = [ChainId.Cosmos, ChainId.Kujira, ChainId.THORChain] as const;

declare global {
  interface Window {
    cosmostation?: {
      cosmos: {
        request: (request: { method: string; params?: any }) => Promise<any>;
      };
      providers: {
        keplr?: any;
      };
    };
  }
}

export const cosmostationWallet = createWallet({
  name: "connectCosmostation",
  supportedChains: [Chain.Cosmos, Chain.Kujira, Chain.THORChain],
  connect: ({ addChain, supportedChains }) =>
    async function connectCosmostation(chains: Chain[]) {
      const filteredChains = filterSupportedChains({
        chains,
        supportedChains,
        walletType: WalletOption.COSMOSTATION,
      });

      const cosmostationProvider = window.cosmostation;
      if (!cosmostationProvider) {
        throw new Error("Cosmostation wallet not found");
      }

      const keplrProvider = cosmostationProvider.providers?.keplr;
      if (!keplrProvider) {
        throw new Error("Cosmostation Keplr provider not found");
      }

      await Promise.all(
        filteredChains.map(async (chain) => {
          const chainId = ChainToChainId[chain] as (typeof cosmostationSupportedChainIds)[number];

          if (!cosmostationSupportedChainIds.includes(chainId)) {
            throw new Error(`Unsupported chain ${chain} for Cosmostation`);
          }

          await keplrProvider.enable(chainId);
          const signer = keplrProvider.getOfflineSignerOnlyAmino(chainId);
          if (!signer) throw new Error("Could not load signer");

          const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");

          const accounts = await signer.getAccounts();
          if (!accounts?.[0]?.address) throw new Error("No accounts found");

          const [{ address }] = accounts;
          const toolbox = getCosmosToolbox(chain, { signer });

          addChain({
            ...toolbox,
            chain,
            address,
            walletType: WalletOption.COSMOSTATION,
          });
        }),
      );

      return true;
    },
});
