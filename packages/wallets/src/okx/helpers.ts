import {
  Chain,
  ChainId,
  type EVMChain,
  SKConfig,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { GaiaToolbox } from "@swapkit/toolboxes/cosmos";
import type { BTCToolbox, UTXOTransferParams } from "@swapkit/toolboxes/utxo";
import type { Eip1193Provider } from "ethers";

const cosmosTransfer =
  () =>
  async ({ from, recipient, amount, asset, memo }: any) => {
    if (!(window.okxwallet && "keplr" in window.okxwallet)) {
      throw new Error("No cosmos okxwallet found");
    }
    const { createSigningStargateClient } = await import("@swapkit/toolboxes/cosmos");

    const { keplr: wallet } = window.okxwallet;
    const offlineSigner = wallet?.getOfflineSignerOnlyAmino(ChainId.Cosmos);

    const cosmJS = await createSigningStargateClient(SKConfig.get("rpcUrls").GAIA, offlineSigner);

    const coins = [
      { denom: asset?.symbol === "MUON" ? "umuon" : "uatom", amount: amount.amount().toString() },
    ];

    const { transactionHash } = await cosmJS.sendTokens(from, recipient, coins, 1.6, memo);
    return transactionHash;
  };

async function getWeb3WalletMethods({
  walletProvider,
  chain,
}: { walletProvider: Eip1193Provider | undefined; chain: EVMChain }) {
  const { getToolboxByChain } = await import("@swapkit/toolboxes/evm");
  const { BrowserProvider } = await import("ethers");
  if (!walletProvider) throw new Error("Requested web3 wallet is not installed");

  const provider = new BrowserProvider(walletProvider, "any");
  const signer = await provider.getSigner();

  const toolbox = getToolboxByChain(chain)({ provider, signer });

  try {
    if (chain !== Chain.Ethereum && "getNetworkParams" in toolbox) {
      await switchEVMWalletNetwork(provider, chain, toolbox.getNetworkParams());
    }
  } catch (_error) {
    throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
  }

  return prepareNetworkSwitch({ toolbox, provider, chain });
}

export async function getWalletMethods(
  chain: Chain,
): Promise<
  (
    | ReturnType<typeof GaiaToolbox>
    | Awaited<ReturnType<typeof getWeb3WalletMethods>>
    | ReturnType<typeof BTCToolbox>
  ) & { address: string }
> {
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

      const { getProvider } = await import("@swapkit/toolboxes/evm");

      const evmWallet = await getWeb3WalletMethods({
        chain,
        walletProvider: window.okxwallet,
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
      const { Psbt } = await import("bitcoinjs-lib");
      const { BTCToolbox } = await import("@swapkit/toolboxes/utxo");

      const { bitcoin: wallet } = window.okxwallet;
      const address = (await wallet.connect()).address;
      const toolbox = BTCToolbox();

      const signTransaction = async (psbt: InstanceType<typeof Psbt>) => {
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

      await wallet.enable(ChainId.Cosmos);
      const accounts = await wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos).getAccounts();
      if (!accounts?.[0]) throw new Error("No cosmos account found");

      const { GaiaToolbox } = await import("@swapkit/toolboxes/cosmos");
      const [{ address }] = accounts;
      const toolbox = GaiaToolbox();

      return { ...toolbox, address, transfer: cosmosTransfer() };
    }

    default:
      throw new Error(`No wallet for chain ${chain}`);
  }
}
