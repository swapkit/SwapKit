import type { Keplr } from "@keplr-wallet/types";
import {
  Chain,
  ChainId,
  ChainToChainId,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";

const cosmostationSupportedChainIds = [ChainId.Cosmos, ChainId.Kujira, ChainId.THORChain] as const;
const cosmostationSupportedEVMChains = [
  Chain.Ethereum,
  Chain.BinanceSmartChain,
  Chain.Avalanche,
  Chain.Polygon,
  Chain.Arbitrum,
  Chain.Optimism,
  Chain.Base,
] as const;

declare global {
  interface Window {
    cosmostation?: {
      providers?: {
        keplr?: Keplr;
      };
    };
  }
}

async function connectCosmosChains(chains: Chain[], addChain: any, keplrProvider: Keplr) {
  await Promise.all(
    chains.map(async (chain) => {
      const chainId = ChainToChainId[chain] as (typeof cosmostationSupportedChainIds)[number];

      await keplrProvider.enable(chainId);
      const signer = keplrProvider.getOfflineSignerOnlyAmino(chainId);
      if (!signer) throw new Error("Could not load signer");

      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");

      const accounts = await signer.getAccounts();
      if (!accounts?.[0]?.address) throw new Error("No accounts found");

      const [{ address }] = accounts;
      const toolbox = getCosmosToolbox(chain as any, { signer });

      addChain({
        ...toolbox,
        chain,
        address,
        walletType: WalletOption.COSMOSTATION,
      });
    }),
  );
}

async function connectEvmChains(chains: Chain[], addChain: any) {
  const provider = window.ethereum;

  if (!provider) {
    throw new Error("No Ethereum provider found for Cosmostation");
  }

  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No EVM accounts found");
  }

  const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");

  for (const chain of chains) {
    const toolbox = getEvmToolbox(chain as any, { provider });
    const [address] = accounts;

    if (!address) {
      throw new Error("No address found for EVM chain");
    }

    addChain({
      ...toolbox,
      chain,
      address,
      walletType: WalletOption.COSMOSTATION,
    });
  }
}

export const cosmostationWallet = createWallet({
  name: "connectCosmostation",
  supportedChains: [
    Chain.Cosmos,
    Chain.Kujira,
    Chain.THORChain,
    Chain.Ethereum,
    Chain.BinanceSmartChain,
    Chain.Avalanche,
    Chain.Polygon,
    Chain.Arbitrum,
    Chain.Optimism,
    Chain.Base,
  ],
  connect: ({ addChain, supportedChains }) =>
    async function connectCosmostation(chains: Chain[]) {
      const filteredChains = filterSupportedChains({
        chains,
        supportedChains,
        walletType: WalletOption.COSMOSTATION,
      });

      if (!window.cosmostation) {
        throw new Error("Cosmostation wallet not found");
      }

      const cosmosChains = filteredChains.filter((chain) =>
        cosmostationSupportedChainIds.includes(ChainToChainId[chain] as any),
      );
      const evmChains = filteredChains.filter((chain) =>
        cosmostationSupportedEVMChains.includes(chain as any),
      );

      if (cosmosChains.length > 0) {
        const keplrProvider = window.cosmostation.providers?.keplr;
        if (!keplrProvider) {
          throw new Error("Cosmostation Keplr provider not found");
        }

        await connectCosmosChains(cosmosChains, addChain, keplrProvider);
      }

      if (evmChains.length > 0) {
        await connectEvmChains(evmChains, addChain);
      }

      return true;
    },
});
