import {
  Chain,
  ChainId,
  type EVMChain,
  type GenericTransferParams,
  SKConfig,
  SwapKitError,
  prepareNetworkSwitch,
  switchEVMWalletNetwork,
} from "@swapkit/helpers";
import type { TronSigner, TronTransaction } from "@swapkit/toolboxes/tron";
import { Psbt } from "bitcoinjs-lib";
import type { Eip1193Provider } from "ethers";

const cosmosTransfer =
  (sender: string) =>
  async ({ recipient, assetValue, memo }: GenericTransferParams) => {
    if (!(window.okxwallet && "keplr" in window.okxwallet)) {
      throw new SwapKitError("wallet_okx_not_found", { chain: Chain.Cosmos });
    }
    const { createSigningStargateClient } = await import("@swapkit/toolboxes/cosmos");

    const { keplr: wallet } = window.okxwallet;
    const offlineSigner = wallet?.getOfflineSignerOnlyAmino(ChainId.Cosmos);

    const cosmJS = await createSigningStargateClient(SKConfig.get("rpcUrls").GAIA, offlineSigner);

    const coins = [
      {
        denom: assetValue?.symbol === "MUON" ? "umuon" : "uatom",
        amount: assetValue.getBaseValue("string"),
      },
    ];

    const { transactionHash } = await cosmJS.sendTokens(sender, recipient, coins, 1.6, memo);
    return transactionHash;
  };

async function getWeb3WalletMethods({
  walletProvider,
  chain,
}: { walletProvider: Eip1193Provider | undefined; chain: EVMChain }) {
  const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
  const { BrowserProvider } = await import("ethers");
  if (!walletProvider) throw new SwapKitError("wallet_okx_not_found");

  const provider = new BrowserProvider(walletProvider, "any");
  const signer = await provider.getSigner();
  const toolbox = await getEvmToolbox(chain, { provider, signer });

  try {
    if (chain !== Chain.Ethereum && "getNetworkParams" in toolbox) {
      await switchEVMWalletNetwork(provider, chain, toolbox.getNetworkParams());
    }
  } catch (_error) {
    throw new SwapKitError("wallet_okx_failed_to_switch_network", { chain });
  }

  return prepareNetworkSwitch({ toolbox, provider, chain });
}

export async function getWalletMethods(chain: Chain) {
  const { match, P } = await import("ts-pattern");

  return match(chain)
    .with(
      P.union(
        Chain.Ethereum,
        Chain.Base,
        Chain.Avalanche,
        Chain.Arbitrum,
        Chain.Optimism,
        Chain.Polygon,
        Chain.BinanceSmartChain,
      ),
      async () => {
        if (!(window.okxwallet && "send" in window.okxwallet)) {
          throw new SwapKitError("wallet_okx_not_found", { chain });
        }

        const evmWallet = await getWeb3WalletMethods({
          chain: chain as EVMChain,
          walletProvider: window.okxwallet,
        });
        const address: string = (await window.okxwallet.send("eth_requestAccounts", [])).result[0];

        return { ...evmWallet, address };
      },
    )
    .with(Chain.Bitcoin, async () => {
      if (!(window.okxwallet && "bitcoin" in window.okxwallet)) {
        throw new SwapKitError("wallet_okx_not_found", { chain: Chain.Bitcoin });
      }

      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");

      const { bitcoin: wallet } = window.okxwallet;
      const address = (await wallet.connect()).address;

      const signer = {
        signTransaction: async (psbt: InstanceType<typeof Psbt>) => {
          const signedPsbt = await wallet.signPsbt(psbt.toHex(), {
            from: address,
            type: "list",
          });

          return Psbt.fromHex(signedPsbt);
        },
        getAddress: async () => Promise.resolve(address),
      };

      const toolbox = await getUtxoToolbox(Chain.Bitcoin, { signer });

      return { ...toolbox, address };
    })
    .with(Chain.Cosmos, async () => {
      if (!(window.okxwallet && "keplr" in window.okxwallet)) {
        throw new SwapKitError("wallet_okx_not_found", { chain: Chain.Cosmos });
      }
      const { keplr: wallet } = window.okxwallet;

      await wallet.enable(ChainId.Cosmos);
      const accounts = await wallet.getOfflineSignerOnlyAmino(ChainId.Cosmos).getAccounts();
      if (!accounts?.[0]) throw new SwapKitError("wallet_okx_no_accounts", { chain: Chain.Cosmos });

      const { getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");
      const [{ address }] = accounts;
      const toolbox = getCosmosToolbox(Chain.Cosmos);

      return { ...toolbox, address, transfer: cosmosTransfer(address) };
    })
    .with(Chain.Near, async () => {
      if (!(window.okxwallet && "near" in window.okxwallet)) {
        throw new SwapKitError("wallet_okx_not_found", { chain: Chain.Near });
      }

      const { createNearSignerFromProvider } = await import("../helpers/near");
      const { getNearToolbox } = await import("@swapkit/toolboxes/near");

      const provider = window.okxwallet.near;
      const signer = await createNearSignerFromProvider(provider, "OKX");
      const accountId = await signer.getAddress();
      const toolbox = await getNearToolbox({ signer });

      return { ...toolbox, address: accountId };
    })
    .with(Chain.Tron, async () => {
      if (!(window.okxwallet && "tronLink" in window.okxwallet)) {
        throw new SwapKitError("wallet_okx_not_found", { chain: Chain.Tron });
      }

      const { createTronToolbox } = await import("@swapkit/toolboxes/tron");

      const tronLink = window.okxwallet.tronLink;

      // Request account access
      const accounts = await tronLink.request({ method: "tron_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new SwapKitError("wallet_okx_no_accounts", { chain: Chain.Tron });
      }

      const address = tronLink.tronWeb.defaultAddress.base58;

      const signer: TronSigner = {
        getAddress: async () => address,
        signTransaction: async (transaction: TronTransaction) => {
          return await tronLink.tronWeb.trx.sign(transaction);
        },
      };

      const toolbox = await createTronToolbox({ signer });

      return { ...toolbox, address };
    })
    .otherwise(() => {
      throw new SwapKitError("wallet_okx_chain_not_supported", { chain });
    });
}
