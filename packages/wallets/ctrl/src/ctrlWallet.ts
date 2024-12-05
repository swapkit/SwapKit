import {
  type AssetValue,
  Chain,
  ChainToChainId,
  ChainToHexChainId,
  type ConnectConfig,
  type ConnectWalletParams,
  SwapKitError,
  WalletOption,
  ensureEVMApiKeys,
  setRequestClientConfig,
} from "@swapkit/helpers";
import type { ARBToolbox, AVAXToolbox, BSCToolbox } from "@swapkit/toolbox-evm";

import type { WalletTxParams } from "./walletHelpers";
import {
  getCtrlAddress,
  getCtrlMethods,
  getCtrlProvider,
  solanaTransfer,
  walletTransfer,
} from "./walletHelpers";

export const CTRL_SUPPORTED_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Kujira,
  Chain.Litecoin,
  Chain.Maya,
  Chain.Optimism,
  Chain.Polygon,
  Chain.Solana,
  Chain.THORChain,
] as const;

async function getWalletMethodsForChain({
  chain,
  blockchairApiKey,
  covalentApiKey,
  ethplorerApiKey,
}: ConnectConfig & { chain: (typeof CTRL_SUPPORTED_CHAINS)[number] }) {
  switch (chain) {
    case Chain.Solana: {
      const { SOLToolbox } = await import("@swapkit/toolbox-solana");

      const toolbox = SOLToolbox();
      const pubKey = await window.xfi?.solana?.connect();

      if (!pubKey) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }

      return { ...toolbox, transfer: solanaTransfer(toolbox, pubKey.publicKey) };
    }

    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain, THORCHAIN_GAS_VALUE, MAYA_GAS_VALUE } = await import(
        "@swapkit/toolbox-cosmos"
      );

      const gasLimit = chain === Chain.Maya ? MAYA_GAS_VALUE : THORCHAIN_GAS_VALUE;
      const toolbox = getToolboxByChain(chain);

      return {
        ...toolbox(),
        deposit: (tx: WalletTxParams) => walletTransfer({ ...tx, recipient: "" }, "deposit"),
        transfer: (tx: WalletTxParams) => walletTransfer({ ...tx, gasLimit }, "transfer"),
      };
    }

    case Chain.Cosmos:
    case Chain.Kujira: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-cosmos");

      const chainId = ChainToChainId[chain];

      await window.xfi?.keplr?.enable(chainId);
      // @ts-ignore
      const offlineSigner = window.xfi?.keplr?.getOfflineSignerOnlyAmino(chainId);

      const toolbox = getToolboxByChain(chain)();

      const transfer = (params: {
        from: string;
        recipient: string;
        assetValue: AssetValue;
        memo: string;
      }) => toolbox.transfer({ signer: offlineSigner, ...params });

      return {
        ...toolbox,

        transfer,
      };
    }

    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-utxo");
      const toolbox = getToolboxByChain(chain)({ apiKey: blockchairApiKey });

      return { ...toolbox, transfer: walletTransfer };
    }

    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { prepareNetworkSwitch, addEVMWalletNetwork } = await import("@swapkit/helpers");
      const {
        getProvider,
        getToolboxByChain,
        covalentApi,
        ethplorerApi,
        getBalance,
        BrowserProvider,
      } = await import("@swapkit/toolbox-evm");
      const ethereumWindowProvider = getCtrlProvider(chain);

      if (!ethereumWindowProvider) {
        throw new SwapKitError("wallet_ctrl_not_found");
      }

      const apiKeys = ensureEVMApiKeys({ chain, covalentApiKey, ethplorerApiKey });
      const provider = new BrowserProvider(ethereumWindowProvider, "any");
      const signer = await provider.getSigner();
      const toolbox = getToolboxByChain(chain)({ ...apiKeys, provider, signer });
      const ctrlMethods = getCtrlMethods(provider);

      try {
        chain !== Chain.Ethereum &&
          (await addEVMWalletNetwork(
            //@ts-expect-error
            ethereumWindowProvider,
            (
              toolbox as
                | ReturnType<typeof AVAXToolbox>
                | ReturnType<typeof BSCToolbox>
                | ReturnType<typeof ARBToolbox>
            ).getNetworkParams(),
          ));
      } catch (_error) {
        throw new SwapKitError({
          errorKey: "wallet_failed_to_add_or_switch_network",
          info: { wallet: WalletOption.CTRL, chain },
        });
      }

      const api =
        chain === Chain.Ethereum
          ? ethplorerApi(apiKeys.ethplorerApiKey)
          : covalentApi({ apiKey: apiKeys.covalentApiKey, chainId: ChainToChainId[chain] });

      return prepareNetworkSwitch({
        //@ts-expect-error
        provider: window.xfi?.ethereum,
        chainId: ChainToHexChainId[chain],
        toolbox: {
          ...toolbox,
          ...ctrlMethods,
          // Overwrite ctrl getBalance due to race condition in their app when connecting multiple evm wallets
          getBalance: (address: string, potentialScamFilter?: boolean) =>
            getBalance({
              chain,
              provider: getProvider(chain),
              api,
              address,
              potentialScamFilter,
            }),
        },
      });
    }

    default:
      return null;
  }
}

function connectCtrl({
  addChain,
  config: { covalentApiKey, ethplorerApiKey, blockchairApiKey, thorswapApiKey },
}: ConnectWalletParams) {
  return async (chains: (typeof CTRL_SUPPORTED_CHAINS)[number][]) => {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const promises = chains.map(async (chain) => {
      const address = await getCtrlAddress(chain);
      const walletMethods = await getWalletMethodsForChain({
        chain,
        blockchairApiKey,
        covalentApiKey,
        ethplorerApiKey,
      });

      addChain({
        ...walletMethods,
        address,
        balance: [],
        chain,
        walletType: WalletOption.CTRL,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const ctrlWallet = { connectCtrl } as const;
