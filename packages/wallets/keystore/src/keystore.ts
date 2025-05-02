import {
  Chain,
  type ChainApis,
  type ConnectWalletParams,
  CosmosChains,
  type DerivationPathArray,
  EVMChains,
  NetworkDerivationPath,
  UTXOChains,
  WalletOption,
  type Witness,
  derivationPathToString,
  filterSupportedChains,
  getRPCUrl,
  pickEvmApiKey,
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

const KEYSTORE_SUPPORTED_CHAINS = [
  ...EVMChains,
  ...UTXOChains,
  ...CosmosChains,
  Chain.Polkadot,
  Chain.Chainflip,
  Chain.Solana,
  Chain.Ripple,
] as const;

type KeystoreOptions = {
  ethplorerApiKey?: string;
  blockchairApiKey?: string;
  covalentApiKey?: string;
  swapkitApiKey?: string;
  stagenet?: boolean;
};

type Params = KeystoreOptions & {
  apis?: ChainApis;
  rpcUrl?: string;
  chain: Chain;
  phrase: string;
  derivationPath: string;
};

const getWalletMethodsForChain = async ({
  apis,
  rpcUrl,
  chain,
  phrase,
  ethplorerApiKey,
  covalentApiKey,
  blockchairApiKey,
  swapkitApiKey,
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
      const { getProvider, getToolboxByChain } = await import("@swapkit/toolbox-evm");
      const { HDNodeWallet } = await import("ethers");

      const api = apis?.[chain];

      const apiKey = pickEvmApiKey({
        chain,
        nonEthApiKey: covalentApiKey,
        ethApiKey: ethplorerApiKey,
      });
      const provider = getProvider(chain, rpcUrl);
      const wallet = HDNodeWallet.fromPhrase(phrase).connect(provider);
      const params = { api, apiKey, provider, signer: wallet };

      return { address: wallet.address, walletMethods: getToolboxByChain(chain)(params) };
    }

    case Chain.BitcoinCash: {
      const { BCHToolbox } = await import("@swapkit/toolbox-utxo");

      const api = apis?.[chain];

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

      const api = apis?.[chain];

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

      const api = apis?.[chain];

      const toolbox = getToolboxByChain(chain)({ server: api, stagenet, swapkitApiKey });
      const address = await toolbox.getAddressFromMnemonic(phrase);
      const signer = await toolbox.getSigner(phrase);

      const transfer = (params: TransferParams) => toolbox.transfer({ ...params, signer });

      return { address, walletMethods: { ...toolbox, transfer } };
    }

    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-cosmos");

      const api = apis?.[chain];

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
      const { SOLToolbox, createKeysForPath } = await import("@swapkit/toolbox-solana");
      const signer = createKeysForPath({ phrase, derivationPath });
      const toolbox = SOLToolbox({ rpcUrl, signer });

      return {
        address: toolbox.getAddressFromKeys(signer),
        walletMethods: {
          ...toolbox,
        },
      };
    }

    case Chain.Ripple: {
      const { XRPToolbox, createSigner } = await import("@swapkit/toolbox-ripple");
      const signer = createSigner(phrase);
      const toolbox = XRPToolbox({ rpcUrl, signer });

      return {
        address: signer.address,
        walletMethods: {
          ...toolbox,
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
  config: {
    thorswapApiKey,
    covalentApiKey,
    ethplorerApiKey,
    blockchairApiKey,
    stagenet,
    swapkitApiKey,
  },
}: ConnectWalletParams) {
  return async function connectKeystore(
    chains: Chain[],
    phrase: string,
    derivationPathMapOrIndex?: { [chain in Chain]?: DerivationPathArray } | number,
  ) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      KEYSTORE_SUPPORTED_CHAINS,
      WalletOption.KEYSTORE,
    );

    const promises = supportedChains.map(async (chain) => {
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
        apis,
        rpcUrl: rpcUrls[chain],
        covalentApiKey,
        ethplorerApiKey,
        phrase,
        blockchairApiKey,
        swapkitApiKey,
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
