import {
  type AssetValue,
  Chain,
  type ConnectWalletParams,
  type DerivationPathArray,
  NetworkDerivationPath,
  type WalletChain,
  WalletOption,
  type WalletTxParams,
  type Witness,
  derivationPathToString,
  ensureEVMApiKeys,
  getRPCUrl,
  setRequestClientConfig,
  updatedLastIndex,
} from "@swapkit/helpers";
import type { DepositParam, TransferParams } from "@swapkit/toolbox-cosmos";
import type {
  Psbt,
  TransactionType,
  UTXOTransferParams,
  UTXOWalletTransferParams,
} from "@swapkit/toolbox-utxo";

type KeystoreOptions = {
  ethplorerApiKey?: string;
  blockchairApiKey?: string;
  covalentApiKey?: string;
  stagenet?: boolean;
};

type Params = KeystoreOptions & {
  api?: any;
  rpcUrl?: string;
  chain: Chain;
  phrase: string;
  derivationPath: string;
};

const getWalletMethodsForChain = async ({
  api,
  rpcUrl,
  chain,
  phrase,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
  derivationPath,
  stagenet,
}: Params) => {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { HDNodeWallet, getProvider, getToolboxByChain } = await import("@swapkit/toolbox-evm");

      const keys = ensureEVMApiKeys({ chain, covalentApiKey, ethplorerApiKey });
      const provider = getProvider(chain, rpcUrl);
      const wallet = HDNodeWallet.fromPhrase(phrase).connect(provider);
      const params = { ...keys, api, provider, signer: wallet };

      return { address: wallet.address, walletMethods: getToolboxByChain(chain)(params) };
    }

    case Chain.BitcoinCash: {
      const { BCHToolbox } = await import("@swapkit/toolbox-utxo");
      const toolbox = BCHToolbox({ rpcUrl, apiKey: blockchairApiKey, apiClient: api });
      const keys = await toolbox.createKeysForPath({ phrase, derivationPath });
      const address = toolbox.getAddressFromKeys(keys);

      function signTransaction({ builder, utxos }: Awaited<ReturnType<typeof toolbox.buildBCHTx>>) {
        utxos.forEach((utxo, index) => {
          builder.sign(index, keys, undefined, 0x41, (utxo.witnessUtxo as Witness).value);
        });

        return builder.build();
      }

      const walletMethods = {
        ...toolbox,
        transfer: (
          params: UTXOWalletTransferParams<
            Awaited<ReturnType<typeof toolbox.buildBCHTx>>,
            TransactionType
          >,
        ) => toolbox.transfer({ ...params, from: address, signTransaction }),
      };

      return { address, walletMethods };
    }

    case Chain.Bitcoin:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-utxo");

      const toolbox = getToolboxByChain(chain)({
        rpcUrl,
        apiKey: blockchairApiKey,
        apiClient: api,
      });

      const keys = toolbox.createKeysForPath({ phrase, derivationPath });
      const address = toolbox.getAddressFromKeys(keys);

      return {
        address,
        walletMethods: {
          ...toolbox,
          transfer: (params: UTXOTransferParams) =>
            toolbox.transfer({
              ...params,
              from: address,
              signTransaction: (psbt: Psbt) => psbt.signAllInputs(keys),
            }),
        },
      };
    }

    case Chain.Cosmos:
    case Chain.Kujira: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-cosmos");
      const toolbox = getToolboxByChain(chain)({ server: api, stagenet });
      const address = await toolbox.getAddressFromMnemonic(phrase);
      const signer = await toolbox.getSigner(phrase);

      const transfer = (params: TransferParams) => toolbox.transfer({ ...params, signer });

      return { address, walletMethods: { ...toolbox, transfer } };
    }

    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-cosmos");

      const toolbox = getToolboxByChain(chain)({ server: api, stagenet });
      const signer = await toolbox.getSigner(phrase);
      const address = await toolbox.getAddressFromMnemonic(phrase);

      return {
        address,
        walletMethods: {
          ...toolbox,
          deposit: ({ assetValue, memo }: DepositParam) =>
            toolbox.deposit({ assetValue, memo, from: address, signer }),
          transfer: (params: TransferParams) =>
            toolbox.transfer({ ...params, from: address, signer }),
          signMessage: async (message: string) => {
            const privateKey = await toolbox.createPrivateKeyFromPhrase(phrase);
            return toolbox.signWithPrivateKey({ privateKey, message });
          },
        },
      };
    }

    case Chain.Polkadot:
    case Chain.Chainflip: {
      const { Network, getToolboxByChain, createKeyring } = await import(
        "@swapkit/toolbox-substrate"
      );

      const signer = await createKeyring(phrase, Network[chain].prefix);
      const toolbox = await getToolboxByChain(chain, {
        signer,
        providerUrl:
          chain === Chain.Polkadot ? getRPCUrl(Chain.Polkadot) : getRPCUrl(Chain.Chainflip),
      });

      return { address: signer.address, walletMethods: toolbox };
    }

    case Chain.Solana: {
      const { SOLToolbox } = await import("@swapkit/toolbox-solana");
      const toolbox = SOLToolbox({ rpcUrl });
      const keypair = toolbox.createKeysForPath({ phrase, derivationPath });

      return {
        address: toolbox.getAddressFromKeys(keypair),
        walletMethods: {
          ...toolbox,
          transfer: (params: WalletTxParams & { assetValue: AssetValue }) =>
            toolbox.transfer({ ...params, fromKeypair: keypair }),
        },
      };
    }

    default:
      throw new Error(`Unsupported chain ${chain}`);
  }
};

function connectKeystore({
  addChain,
  apis,
  rpcUrls,
  config: { thorswapApiKey, covalentApiKey, ethplorerApiKey, blockchairApiKey, stagenet },
}: ConnectWalletParams) {
  return async function connectKeystore(
    chains: WalletChain[],
    phrase: string,
    derivationPathMapOrIndex?: { [chain in Chain]?: DerivationPathArray } | number,
  ) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const promises = chains.map(async (chain) => {
      const derivationPathIndex =
        typeof derivationPathMapOrIndex === "number" ? derivationPathMapOrIndex : 0;

      const derivationPathFromMap =
        derivationPathMapOrIndex && typeof derivationPathMapOrIndex === "object"
          ? derivationPathMapOrIndex[chain]
          : undefined;

      const [first, second, third, fourth, fifth] = NetworkDerivationPath[chain];

      const derivationPathArray: DerivationPathArray =
        derivationPathFromMap ||
        updatedLastIndex(
          chain === Chain.Solana
            ? [first, second, third, fourth]
            : [first, second, third, fourth, fifth],
          derivationPathIndex,
        );

      const derivationPath = derivationPathToString(derivationPathArray);

      const { address, walletMethods } = await getWalletMethodsForChain({
        derivationPath,
        chain,
        api: apis[chain],
        rpcUrl: rpcUrls[chain],
        covalentApiKey,
        ethplorerApiKey,
        phrase,
        blockchairApiKey,
        stagenet,
      });

      addChain({
        ...walletMethods,
        chain,
        address,
        balance: [],
        walletType: WalletOption.KEYSTORE,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const keystoreWallet = { connectKeystore } as const;
