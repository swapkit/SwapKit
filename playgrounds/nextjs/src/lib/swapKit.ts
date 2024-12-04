import { type AssetValue, type Chain, WalletOption } from "@swapkit/helpers";

import { atom, useAtom } from "jotai";
import { useCallback, useEffect } from "react";

const swapKitAtom = atom<any | null>(null);
const balanceAtom = atom<AssetValue[]>([]);
const walletState = atom<{ connected: boolean; type: WalletOption | null }>({
  connected: false,
  type: null,
});

export const useSwapKit = () => {
  const [swapKit, setSwapKit] = useAtom(swapKitAtom);
  const [balances, setBalances] = useAtom(balanceAtom);
  const [{ type: walletType, connected: isWalletConnected }, setWalletState] = useAtom(walletState);

  useEffect(() => {
    const loadSwapKit = async () => {
      const { SwapKit } = await import("@swapkit/core");
      const { ChainflipPlugin } = await import("@swapkit/plugin-chainflip");
      const { KadoPlugin } = await import("@swapkit/plugin-kado");
      const { ThorchainPlugin, MayachainPlugin } = await import("@swapkit/plugin-thorchain");
      const { wallets } = await import("@swapkit/wallets");

      const swapKitClient = SwapKit({
        config: {
          blockchairApiKey:
            process.env.NEXT_PUBLIC_BLOCKCHAIR_API_KEY || "A___Tcn5B16iC3mMj7QrzZCb2Ho1QBUf",
          covalentApiKey:
            process.env.NEXT_PUBLIC_COVALENT_API_KEY || "cqt_rQ6333MVWCVJFVX3DbCCGMVqRH4q",
          ethplorerApiKey: process.env.NEXT_PUBLIC_ETHPLORER_API_KEY || "freekey",
          walletConnectProjectId: "",
          keepkeyConfig: {
            apiKey: localStorage.getItem("keepkeyApiKey") || "",
            pairingInfo: {
              name: "THORSwap",
              imageUrl: "https://www.thorswap.finance/logo.png",
              basePath: "swap",
              url: "https://app.thorswap.finance",
            },
          },
        },
        wallets,
        plugins: { ...ThorchainPlugin, ...ChainflipPlugin, ...MayachainPlugin, ...KadoPlugin },
      });

      setSwapKit(swapKitClient);
    };

    loadSwapKit();
  }, [setSwapKit]);

  const getBalances = useCallback(
    async (refresh?: boolean) => {
      if (!refresh && balances.length) return;

      const connectedChains =
        (Object.keys(swapKit?.connectedChains || {}).filter(Boolean) as Chain[]) || [];

      let nextBalances: AssetValue[] = [];

      for (const chain of connectedChains) {
        const balance = await swapKit?.getBalance(chain);

        if (balance) {
          nextBalances = nextBalances.concat(balance);
        }
      }

      setBalances(nextBalances.sort((a, b) => a.getValue("number") - b.getValue("number")));
    },
    [swapKit, setBalances, balances],
  );

  const connectWallet = useCallback(
    (option: WalletOption, chains: Chain[]) => {
      switch (option) {
        case WalletOption.XDEFI: {
          swapKit?.connectXDEFI(chains);
          break;
        }

        default:
          break;
      }

      setWalletState({ connected: !!swapKit?.getAddress(chains[0]), type: option });

      getBalances();
    },
    [setWalletState, getBalances, swapKit],
  );

  const disconnectWallet = useCallback(() => {
    for (const chain of Object.keys(swapKit?.connectedChains || {})) {
      swapKit?.disconnectChain(chain as Chain);
    }

    setWalletState({ connected: false, type: null });
  }, [setWalletState, swapKit]);

  const checkIfChainConnected = useCallback(
    (chain: Chain) => !!swapKit?.getAddress(chain),
    [swapKit?.getAddress],
  );

  return {
    balances,
    checkIfChainConnected,
    connectWallet,
    disconnectWallet,
    getBalances,
    isWalletConnected,
    setSwapKit,
    swapKit,
    walletType,
  };
};
