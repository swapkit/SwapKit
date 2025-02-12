import type { Keplr } from "@keplr-wallet/types";
import {
  type AssetValue,
  Chain,
  ChainId,
  ChainToChainId,
  type ConnectWalletParams,
  WalletOption,
  type WalletTxParams,
  filterSupportedChains,
  setRequestClientConfig,
} from "@swapkit/helpers";
import type { ThorchainToolboxType } from "@swapkit/toolbox-cosmos";
import { chainRegistry } from "./chainRegistry";

declare global {
  interface Window {
    keplr: Keplr;
    leap: Keplr;
  }
}

const keplrSupportedChainIds = [ChainId.Cosmos, ChainId.Kujira, ChainId.THORChain] as const;
const KEPLR_SUPPORTED_CHAINS = [Chain.Cosmos, Chain.Kujira, Chain.THORChain] as const;

type TransferParams = WalletTxParams & { assetValue: AssetValue };

function connectKeplr({
  addChain,
  config: { thorswapApiKey },
}: ConnectWalletParams<{
  transfer: (params: TransferParams) => Promise<string>;
}>) {
  return async function connectKeplr(chains: Chain[], extensionKey: "keplr" | "leap" = "keplr") {
    const walletType = extensionKey === "keplr" ? WalletOption.KEPLR : WalletOption.LEAP;
    const supportedChains = filterSupportedChains(chains, KEPLR_SUPPORTED_CHAINS, walletType);

    setRequestClientConfig({ apiKey: thorswapApiKey });
    const keplrClient = window[extensionKey];

    const toolboxPromises = supportedChains.map(async (chain) => {
      const chainId = ChainToChainId[chain] as (typeof keplrSupportedChainIds)[number];

      if (!keplrSupportedChainIds.includes(chainId)) {
        const chainConfig = chainRegistry.get(chainId);
        if (!chainConfig) throw new Error(`Unsupported chain ${chain}`);
        await keplrClient.experimentalSuggestChain(chainConfig);
      }

      keplrClient?.enable(chainId);
      const offlineSigner = keplrClient?.getOfflineSignerOnlyAmino(chainId, {
        preferNoSetFee: chain === Chain.THORChain,
      });
      if (!offlineSigner) throw new Error("Could not load offlineSigner");
      const { getToolboxByChain } = await import("@swapkit/toolbox-cosmos");

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
          ? {
              deposit: (params: {
                from?: string;
                assetValue: AssetValue;
                memo?: string;
              }) =>
                (toolbox as ThorchainToolboxType).deposit({
                  ...params,
                  signer: offlineSigner,
                  from: params.from || address,
                  memo: params.memo || "",
                }),
            }
          : {};

      addChain({
        ...toolbox,
        ...deposit,
        chain,
        transfer,
        address,
        balance: [],
        walletType,
      });
    });

    await Promise.all(toolboxPromises);

    return true;
  };
}

export const keplrWallet = { connectKeplr } as const;
