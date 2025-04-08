import {
  Chain,
  ChainToHexChainId,
  type EVMChain,
  EVMChains,
  WalletOption,
  createWallet,
  filterSupportedChains,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { BrowserProvider, Eip1193Provider } from "ethers";
import { getWalletSupportedChains } from "../utils";

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
    case WalletOption.COINBASE_WEB:
      return window.coinbaseWalletExtension;
    case WalletOption.TRUSTWALLET_WEB:
      return window.trustwallet;
    default:
      return window.ethereum;
  }
};

export const getWeb3WalletMethods = async ({
  address,
  walletProvider,
  chain,
  provider,
}: {
  address: string;
  walletProvider?: Eip1193Provider;
  chain: EVMChain;
  provider: BrowserProvider;
}) => {
  if (!walletProvider) throw new Error("Requested web3 wallet is not installed");
  const { getToolboxByChain } = await import("@swapkit/toolboxes/evm");

  const signer = await provider.getSigner();
  const toolbox = getToolboxByChain(chain)({ provider, signer });

  if (chain !== Chain.Ethereum) {
    const currentNetwork = await provider.getNetwork();
    if (currentNetwork.chainId.toString() !== ChainToHexChainId[chain]) {
      try {
        const networkParams = toolbox.getNetworkParams();
        await switchEVMWalletNetwork(provider, chain, networkParams);
      } catch (_error) {
        throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
      }
    }
  }

  return prepareNetworkSwitch({
    toolbox: { ...toolbox, getBalance: () => toolbox.getBalance(address) },
    chain,
    provider,
  });
};

export const evmWallet = createWallet({
  name: "connectEVMWallet",
  supportedChains: [...EVMChains] as EVMChain[],
  connect: ({ addChain, supportedChains }) =>
    async function connectEVMWallet(
      chains: Chain[],
      walletType: EVMWalletOptions = WalletOption.METAMASK,
      eip1193Provider?: Eip1193Provider,
    ) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });
      const { BrowserProvider } = await import("ethers");

      await Promise.all(
        filteredChains.map(async (chain) => {
          if (walletType === WalletOption.EIP6963) {
            if (!eip1193Provider) throw new Error("Missing provider");

            const provider = new BrowserProvider(eip1193Provider, "any");
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            const walletMethods = await getWeb3WalletMethods({
              address,
              chain,
              provider,
              walletProvider: eip1193Provider,
            });

            addChain({ ...walletMethods, address, chain, walletType });
            return;
          }

          const web3provider = new BrowserProvider(getWalletForType(walletType), "any");
          await web3provider.send("eth_requestAccounts", []);
          const signer = await web3provider.getSigner();
          const address = await signer.getAddress();

          const walletMethods = await getWeb3WalletMethods({
            address,
            chain,
            walletProvider: getWalletForType(walletType),
            provider: web3provider,
          });

          const disconnect = () =>
            web3provider.send("wallet_revokePermissions", [{ eth_accounts: {} }]);

          addChain({ ...walletMethods, address, chain, disconnect, walletType });
        }),
      );

      return true;
    },
});

export const EVM_EXTENSIONS_SUPPORTED_CHAINS = getWalletSupportedChains(evmWallet);
