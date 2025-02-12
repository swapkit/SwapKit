import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";
import {
  Chain,
  type ChainApis,
  ChainToHexChainId,
  type EVMChain,
  type EthereumWindowProvider,
  SwapKitError,
  WalletOption,
  pickEvmApiKey,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { NonETHToolbox } from "@swapkit/toolbox-evm";
import { type InjectedWindow, Network } from "@swapkit/toolbox-substrate";
import type { Eip1193Provider } from "ethers";

declare const window: {
  talismanEth: EthereumWindowProvider;
} & Window &
  InjectedWindow;

export const convertAddress = (inputAddress: string, newPrefix: number): string => {
  const decodedAddress = decodeAddress(inputAddress);
  const convertedAddress = encodeAddress(decodedAddress, newPrefix);
  return convertedAddress;
};

export const getWeb3WalletMethods = async ({
  apis,
  ethereumWindowProvider,
  chain,
  covalentApiKey,
  ethplorerApiKey,
}: {
  apis?: ChainApis;
  ethereumWindowProvider: Eip1193Provider | undefined;
  chain: EVMChain;
  covalentApiKey?: string;
  ethplorerApiKey?: string;
}) => {
  const { getToolboxByChain } = await import("@swapkit/toolbox-evm");
  const { BrowserProvider } = await import("ethers");

  if (!ethereumWindowProvider) {
    throw new SwapKitError({
      errorKey: "wallet_provider_not_found",
      info: { wallet: WalletOption.TALISMAN, chain },
    });
  }

  const api = apis?.[chain];

  const apiKey = pickEvmApiKey({ chain, nonEthApiKey: covalentApiKey, ethApiKey: ethplorerApiKey });
  const provider = new BrowserProvider(ethereumWindowProvider, "any");
  const signer = await provider.getSigner();

  const toolbox = getToolboxByChain(chain)({ api, apiKey, provider, signer });

  try {
    chain !== Chain.Ethereum &&
      (await switchEVMWalletNetwork(
        provider,
        ChainToHexChainId[chain],
        (toolbox as NonETHToolbox).getNetworkParams(),
      ));
  } catch (_error) {
    throw new SwapKitError({
      errorKey: "wallet_failed_to_add_or_switch_network",
      info: { wallet: WalletOption.TALISMAN, chain },
    });
  }

  return prepareNetworkSwitch<typeof toolbox>({
    toolbox: { ...toolbox },
    chainId: ChainToHexChainId[chain],
    provider,
  });
};

export const getWalletForChain = async ({
  apis,
  chain,
  ethplorerApiKey,
  covalentApiKey,
}: {
  apis?: ChainApis;
  chain: Chain;
  ethplorerApiKey?: string;
  covalentApiKey?: string;
}) => {
  switch (chain) {
    case Chain.Ethereum:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Avalanche:
    case Chain.BinanceSmartChain:
    case Chain.Base: {
      if (!(window.talismanEth && "send" in window.talismanEth)) {
        throw new SwapKitError({ errorKey: "wallet_talisman_not_found", info: { chain } });
      }

      const { getProvider } = await import("@swapkit/toolbox-evm");

      const evmWallet = await getWeb3WalletMethods({
        apis,
        chain,
        ethereumWindowProvider: window.talismanEth,
        covalentApiKey,
        ethplorerApiKey,
      });

      const address: string = (await window.talismanEth.send("eth_requestAccounts", []))[0];

      const getBalance = async (addressOverwrite?: string, potentialScamFilter = true) =>
        evmWallet.getBalance(addressOverwrite || address, potentialScamFilter, getProvider(chain));

      return { walletMethods: { ...evmWallet, getBalance }, address };
    }

    case Chain.Polkadot:
    case Chain.Chainflip: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-substrate");

      const injectedWindow = window as Window & InjectedWindow;
      const injectedExtension = injectedWindow?.injectedWeb3?.talisman;
      const rawExtension = await injectedExtension?.enable?.("talisman");

      if (!rawExtension) {
        throw new SwapKitError({
          errorKey: "wallet_talisman_not_enabled",
          info: { chain },
        });
      }

      const toolbox = await getToolboxByChain(chain, { signer: rawExtension.signer });
      const accounts = await rawExtension.accounts.get();

      if (!accounts[0]?.address) {
        throw new SwapKitError({
          errorKey: "wallet_missing_params",
          info: { wallet: WalletOption.TALISMAN, accounts, address: accounts[0]?.address },
        });
      }

      const address = convertAddress(accounts[0].address, Network[chain].prefix);

      return {
        walletMethods: { ...toolbox, getAddress: () => address },
        address,
      };
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.TALISMAN },
      });
  }
};
