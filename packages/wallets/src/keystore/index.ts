import {
  type AssetValue,
  Chain,
  CosmosChains,
  type DerivationPathArray,
  EVMChains,
  NetworkDerivationPath,
  SKConfig,
  UTXOChains,
  WalletOption,
  type WalletTxParams,
  createWallet,
  derivationPathToString,
  filterSupportedChains,
  updatedLastIndex,
} from "@swapkit/helpers";
import type { DepositParam, TransferParams } from "@swapkit/toolboxes/cosmos";
import type {
  TransactionType,
  UTXOTransferParams,
  UTXOWalletTransferParams,
} from "@swapkit/toolboxes/utxo";
import type { Psbt } from "bitcoinjs-lib";
import { getWalletSupportedChains } from "../helpers";

type Params = {
  chain: Chain;
  phrase: string;
  derivationPath: string;
};

const getWalletMethods = async ({ chain, phrase, derivationPath }: Params) => {
  const rpcUrl = SKConfig.get("rpcUrls")[chain];

  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { getProvider, getToolboxByChain } = await import("@swapkit/toolboxes/evm");
      const { HDNodeWallet } = await import("ethers");

      const provider = getProvider(chain, rpcUrl);
      const wallet = HDNodeWallet.fromPhrase(phrase).connect(provider);
      const toolbox = getToolboxByChain(chain)({ provider, signer: wallet });

      return { address: wallet.address, walletMethods: toolbox };
    }

    case Chain.BitcoinCash: {
      const { BCHToolbox } = await import("@swapkit/toolboxes/utxo");
      const toolbox = BCHToolbox();
      const keys = await toolbox.createKeysForPath({ phrase, derivationPath });
      const address = toolbox.getAddressFromKeys(keys);

      async function signTransaction({
        builder,
        utxos,
      }: Awaited<ReturnType<typeof toolbox.buildBCHTx>>) {
        utxos.forEach((utxo, index) => {
          builder.sign(index, keys, undefined, 0x41, utxo.witnessUtxo?.value);
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
      const { getToolboxByChain } = await import("@swapkit/toolboxes/utxo");

      const toolbox = getToolboxByChain(chain)();

      const keys = await toolbox.createKeysForPath({ phrase, derivationPath });
      const address = toolbox.getAddressFromKeys(keys);

      return {
        address,
        walletMethods: {
          ...toolbox,
          transfer: (params: UTXOTransferParams) =>
            toolbox.transfer({
              ...params,
              from: address,
              signTransaction: async (psbt: Psbt) => psbt.signAllInputs(keys),
            }),
        },
      };
    }

    case Chain.Cosmos:
    case Chain.Kujira: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/cosmos");
      const toolbox = getToolboxByChain(chain)();
      const address = await toolbox.getAddressFromMnemonic(phrase);
      const signer = await toolbox.getSigner(phrase);

      const transfer = (params: TransferParams) => toolbox.transfer({ ...params, signer });

      return { address, walletMethods: { ...toolbox, transfer } };
    }

    case Chain.Maya:
    case Chain.THORChain: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/cosmos");

      const toolbox = getToolboxByChain(chain)();
      const signer = await toolbox.getSigner(phrase);
      const address = await toolbox.getAddressFromMnemonic(phrase);

      return {
        address,
        walletMethods: {
          ...toolbox,
          deposit: (params: DepositParam) => toolbox.deposit({ ...params, from: address, signer }),
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
        "@swapkit/toolboxes/substrate"
      );

      const signer = await createKeyring(phrase, Network[chain].prefix);
      const toolbox = await getToolboxByChain(chain, { signer });

      return { address: signer.address, walletMethods: toolbox };
    }

    case Chain.Solana: {
      const { SOLToolbox } = await import("@swapkit/toolboxes/solana");
      const toolbox = SOLToolbox();
      const keypair = await toolbox.createKeysForPath({ phrase, derivationPath });

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

export const keystoreWallet = createWallet({
  name: "connectKeystore",
  walletType: WalletOption.KEYSTORE,
  supportedChains: [
    ...EVMChains,
    ...UTXOChains,
    ...CosmosChains,
    Chain.Polkadot,
    Chain.Chainflip,
    Chain.Solana,
  ],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectKeystore(
      chains: Chain[],
      phrase: string,
      derivationPathMapOrIndex?: { [chain in Chain]?: DerivationPathArray } | number,
    ) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const derivationPathIndex =
            typeof derivationPathMapOrIndex === "number" ? derivationPathMapOrIndex : 0;

          const derivationPathFromMap =
            derivationPathMapOrIndex && typeof derivationPathMapOrIndex === "object"
              ? derivationPathMapOrIndex[chain]
              : undefined;

          const derivationArrayToUpdate = NetworkDerivationPath[chain].slice(
            0,
            chain === Chain.Solana ? 4 : 5,
          ) as DerivationPathArray;

          const derivationPathArray: DerivationPathArray =
            derivationPathFromMap || updatedLastIndex(derivationArrayToUpdate, derivationPathIndex);

          const derivationPath = derivationPathToString(derivationPathArray);

          const { address, walletMethods } = await getWalletMethods({
            chain,
            derivationPath,
            phrase,
          });

          addChain({ ...walletMethods, address, chain, walletType: WalletOption.KEYSTORE });
        }),
      );

      return true;
    },
});

export const KEYSTORE_SUPPORTED_CHAINS = getWalletSupportedChains(keystoreWallet);

export * from "./helpers";
