import {
  Chain,
  ChainToHexChainId,
  type ConnectWalletParams,
  type EVMChain,
  EVMChains,
  type EthereumWindowProvider,
  WalletOption,
  ensureEVMApiKeys,
  filterSupportedChains,
  prepareNetworkSwitch,
  setRequestClientConfig,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { NonETHToolbox } from "@swapkit/toolbox-evm";
import type { BrowserProvider, Eip1193Provider } from "ethers";

declare const window: {
  ethereum: EthereumWindowProvider;
  trustwallet: EthereumWindowProvider;
  coinbaseWalletExtension: EthereumWindowProvider;
  braveSolana: any;
} & Window;

export type EVMWalletOptions =
  | WalletOption.BRAVE
  | WalletOption.OKX_MOBILE
  | WalletOption.METAMASK
  | WalletOption.TRUSTWALLET_WEB
  | WalletOption.COINBASE_WEB
  | WalletOption.EIP6963;

const getWalletForType = (
  walletType:
    | WalletOption.BRAVE
    | WalletOption.OKX_MOBILE
    | WalletOption.METAMASK
    | WalletOption.TRUSTWALLET_WEB
    | WalletOption.COINBASE_WEB,
) => {
  switch (walletType) {
    case WalletOption.BRAVE:
    case WalletOption.METAMASK:
    case WalletOption.OKX_MOBILE:
      return window.ethereum;
    case WalletOption.COINBASE_WEB:
      return window.coinbaseWalletExtension;
    case WalletOption.TRUSTWALLET_WEB:
      return window.trustwallet;
  }
};

export const getWeb3WalletMethods = async ({
  ethereumWindowProvider,
  chain,
  covalentApiKey,
  ethplorerApiKey,
  provider,
}: {
  ethereumWindowProvider: Eip1193Provider | undefined;
  chain: EVMChain;
  covalentApiKey?: string;
  ethplorerApiKey?: string;
  provider: BrowserProvider;
}) => {
  if (!ethereumWindowProvider) throw new Error("Requested web3 wallet is not installed");
  const { getToolboxByChain } = await import("@swapkit/toolbox-evm");

  const keys = ensureEVMApiKeys({ chain, covalentApiKey, ethplorerApiKey });
  const signer = await provider.getSigner();

  const toolbox = getToolboxByChain(chain)({ ...keys, provider, signer });

  if (chain !== Chain.Ethereum) {
    const currentNetwork = await provider.getNetwork();
    if (currentNetwork.chainId.toString() !== ChainToHexChainId[chain]) {
      try {
        await switchEVMWalletNetwork(
          provider,
          ChainToHexChainId[chain],
          (toolbox as NonETHToolbox).getNetworkParams(),
        );
      } catch (_error) {
        throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
      }
    }
  }

  return prepareNetworkSwitch<typeof toolbox>({
    toolbox: { ...toolbox },
    chainId: ChainToHexChainId[chain],
    provider,
  });
};

function connectEVMWallet({
  addChain,
  config: { covalentApiKey, ethplorerApiKey, thorswapApiKey },
}: ConnectWalletParams) {
  return async function connectEVMWallet(
    chains: Chain[],
    walletType: EVMWalletOptions = WalletOption.METAMASK,
    eip1193Provider?: Eip1193Provider,
  ) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(chains, EVMChains, walletType);

    const promises = supportedChains.map(async (chain) => {
      const { getProvider } = await import("@swapkit/toolbox-evm");
      const { BrowserProvider } = await import("ethers");

      if (walletType === WalletOption.EIP6963) {
        if (!eip1193Provider) throw new Error("Missing provider");
        const provider = new BrowserProvider(eip1193Provider, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const walletMethods = await getWeb3WalletMethods({
          chain,
          ethplorerApiKey,
          covalentApiKey,
          ethereumWindowProvider: eip1193Provider,
          provider,
        });

        const getBalance = async (potentialScamFilter = true) =>
          walletMethods.getBalance(address, potentialScamFilter, getProvider(chain));

        addChain({
          ...walletMethods,
          chain,
          address,
          getBalance,
          balance: [],
          walletType,
        });
        return;
      }

      const web3provider = new BrowserProvider(getWalletForType(walletType), "any");
      await web3provider.send("eth_requestAccounts", []);
      const signer = await web3provider.getSigner();
      const address = await signer.getAddress();

      const walletMethods = await getWeb3WalletMethods({
        chain,
        ethplorerApiKey,
        covalentApiKey,
        ethereumWindowProvider: getWalletForType(walletType),
        provider: web3provider,
      });

      const getBalance = async (potentialScamFilter = true) =>
        walletMethods.getBalance(address, potentialScamFilter, getProvider(chain));

      const disconnect = () =>
        web3provider.send("wallet_revokePermissions", [
          {
            eth_accounts: {},
          },
        ]);

      addChain({
        ...walletMethods,
        disconnect,
        chain,
        address,
        getBalance,
        balance: [],
        walletType,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const evmWallet = { connectEVMWallet } as const;
