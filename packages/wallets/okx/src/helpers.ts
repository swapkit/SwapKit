import {
  Chain,
  type ChainApis,
  ChainId,
  ChainToHexChainId,
  type EVMChain,
  getRPCUrl,
  pickEvmApiKey,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { GaiaToolbox } from "@swapkit/toolbox-cosmos";
import type { AlchemyApiType, CovalentApiType, EthplorerApiType } from "@swapkit/toolbox-evm";
import type { BTCToolbox, Psbt, UTXOTransferParams } from "@swapkit/toolbox-utxo";
import type { Eip1193Provider } from "ethers";

const cosmosTransfer =
  (rpcUrl?: string) =>
  async ({ from, recipient, amount, asset, memo }: any) => {
    if (!(window.okxwallet && "keplr" in window.okxwallet)) {
      throw new Error("No cosmos okxwallet found");
    }

    const { keplr: wallet } = window.okxwallet;
    const offlineSigner = wallet?.getOfflineSignerOnlyAmino(ChainId.Cosmos);

    const { createSigningStargateClient } = await import("@swapkit/toolbox-cosmos");
    const cosmJS = await createSigningStargateClient(
      rpcUrl || getRPCUrl(Chain.Cosmos),
      offlineSigner,
    );

    const coins = [
      { denom: asset?.symbol === "MUON" ? "umuon" : "uatom", amount: amount.amount().toString() },
    ];

    const { transactionHash } = await cosmJS.sendTokens(from, recipient, coins, 1.6, memo);
    return transactionHash;
  };

export const getWalletForChain = async ({
  apis,
  chain,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
  rpcUrl,
}: {
  apis?: ChainApis;
  chain: Chain;
  ethplorerApiKey?: string;
  covalentApiKey?: string;
  blockchairApiKey?: string;
  rpcUrl?: string;
}): Promise<
  (
    | ReturnType<typeof GaiaToolbox>
    | Awaited<ReturnType<typeof getWeb3WalletMethods>>
    | ReturnType<typeof BTCToolbox>
  ) & { address: string }
> => {
  switch (chain) {
    case Chain.Ethereum:
    case Chain.Base:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.BinanceSmartChain: {
      if (!(window.okxwallet && "send" in window.okxwallet)) {
        throw new Error("No okxwallet found");
      }

      const { getProvider } = await import("@swapkit/toolbox-evm");

      const api = apis?.[chain];

      const apiKey = pickEvmApiKey({
        chain,
        nonEthApiKey: covalentApiKey,
        ethApiKey: ethplorerApiKey,
      });

      const evmWallet = await getWeb3WalletMethods({
        chain,
        api,
        apiKey,
        ethereumWindowProvider: window.okxwallet,
      });

      const address: string = (await window.okxwallet.send("eth_requestAccounts", [])).result[0];

      const getBalance = async (addressOverwrite?: string, potentialScamFilter = true) =>
        evmWallet.getBalance(addressOverwrite || address, potentialScamFilter, getProvider(chain));

      return { ...evmWallet, getBalance, address };
    }

    case Chain.Bitcoin: {
      if (!(window.okxwallet && "bitcoin" in window.okxwallet)) {
        throw new Error("No bitcoin okxwallet found");
      }
      const { bitcoin: wallet } = window.okxwallet;

      const { Psbt, BTCToolbox } = await import("@swapkit/toolbox-utxo");

      const api = apis?.[chain];

      const address = (await wallet.connect()).address;

      const toolbox = BTCToolbox({ rpcUrl, apiKey: blockchairApiKey, apiClient: api });
      const signTransaction = async (psbt: Psbt) => {
        const signedPsbt = await wallet.signPsbt(psbt.toHex(), { from: address, type: "list" });

        return Psbt.fromHex(signedPsbt);
      };

      const transfer = (transferParams: UTXOTransferParams) => {
        return toolbox.transfer({ ...transferParams, signTransaction });
      };

      return { ...toolbox, transfer, address };
    }

    case Chain.Cosmos: {
      if (!(window.okxwallet && "keplr" in window.okxwallet)) {
        throw new Error("No bitcoin okxwallet found");
      }
      const { keplr: wallet } = window.okxwallet;

      const api = apis?.[chain];

      await wallet.enable(ChainId.Cosmos);
      const accounts = await wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos).getAccounts();
      if (!accounts?.[0]) throw new Error("No cosmos account found");

      const { GaiaToolbox } = await import("@swapkit/toolbox-cosmos");
      const [{ address }] = accounts;

      return {
        address,
        ...GaiaToolbox({ server: api }),
        transfer: cosmosTransfer(rpcUrl),
      };
    }

    default:
      throw new Error(`No wallet for chain ${chain}`);
  }
};

export const getWeb3WalletMethods = async ({
  ethereumWindowProvider,
  chain,
  api,
  apiKey,
}: {
  ethereumWindowProvider: Eip1193Provider | undefined;
  chain: EVMChain;
  api?: EthplorerApiType | CovalentApiType | AlchemyApiType;
  apiKey?: string;
}) => {
  const { getToolboxByChain } = await import("@swapkit/toolbox-evm");
  const { BrowserProvider } = await import("ethers");
  if (!ethereumWindowProvider) throw new Error("Requested web3 wallet is not installed");

  const provider = new BrowserProvider(ethereumWindowProvider, "any");

  const toolbox = getToolboxByChain(chain)({
    api,
    apiKey,
    provider,
    signer: await provider.getSigner(),
  });

  try {
    if (chain !== Chain.Ethereum && "getNetworkParams" in toolbox) {
      await switchEVMWalletNetwork(provider, ChainToHexChainId[chain], toolbox.getNetworkParams());
    }
  } catch (_error) {
    throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
  }

  return prepareNetworkSwitch({ toolbox, provider, chainId: ChainToHexChainId[chain] });
};
