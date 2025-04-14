import {
  Chain,
  CosmosChains,
  type DerivationPathArray,
  EVMChains,
  NetworkDerivationPath,
  SKConfig,
  UTXOChains,
  WalletOption,
  createWallet,
  derivationPathToString,
  filterSupportedChains,
  updatedLastIndex,
} from "@swapkit/helpers";
import type { TransactionBuilderType, UTXOType } from "@swapkit/toolboxes/utxo";
import type { Psbt } from "bitcoinjs-lib";
import { getWalletSupportedChains } from "../utils";

type Params = {
  chain: Chain;
  phrase: string;
  derivationPath: string;
};

const getKeystoreWallet = async ({ chain, phrase, derivationPath }: Params) => {
  const rpcUrl = SKConfig.get("rpcUrls")[chain];

  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Avalanche:
    case Chain.Base:
    case Chain.BinanceSmartChain:
    case Chain.Ethereum:
    case Chain.Optimism:
    case Chain.Polygon: {
      const { getProvider, getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      const { HDNodeWallet } = await import("ethers");

      const provider = await getProvider(chain, rpcUrl);
      const wallet = HDNodeWallet.fromPhrase(phrase).connect(provider);
      const toolbox = await getEvmToolbox(chain, { provider, signer: wallet });

      return { ...toolbox, address: wallet.address };
    }

    case Chain.BitcoinCash: {
      const { getUtxoToolbox, getCreateKeysForPath, addressFromKeysGetter } = await import(
        "@swapkit/toolboxes/utxo"
      );

      const keys = (await getCreateKeysForPath(chain))({ phrase, derivationPath });
      const address = await (await addressFromKeysGetter(chain))(keys);

      async function signTransaction({
        builder,
        utxos,
      }: { builder: TransactionBuilderType; utxos: UTXOType[] }) {
        utxos.forEach((utxo, index) => {
          builder.sign(index, keys, undefined, 0x41, utxo.witnessUtxo?.value);
        });

        return builder.build();
      }
      const signer = {
        getAddress: () => Promise.resolve(address),
        signTransaction,
      };

      const toolbox = await getUtxoToolbox(Chain.BitcoinCash, { signer });

      return {
        ...toolbox,
        address,
      };
    }

    case Chain.Bitcoin:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getUtxoToolbox, getCreateKeysForPath, addressFromKeysGetter } = await import(
        "@swapkit/toolboxes/utxo"
      );

      const keys = (await getCreateKeysForPath(chain))({ phrase, derivationPath });
      const address = (await addressFromKeysGetter(chain))(keys);

      const signer = {
        getAddress: () => Promise.resolve(address),
        signTransaction: async (psbt: Psbt) => {
          await psbt.signAllInputs(keys);
          return psbt;
        },
      };

      const toolbox = await getUtxoToolbox(chain, { signer });

      return {
        ...toolbox,
        address,
      };
    }

    case Chain.Cosmos:
    case Chain.Kujira:
    case Chain.Maya:
    case Chain.THORChain: {
      const { getCosmosToolbox, getSignerFromPhrase } = await import("@swapkit/toolboxes/cosmos");

      const signer = await getSignerFromPhrase({ phrase, chain });
      const toolbox = getCosmosToolbox(chain, { signer });
      const address = await toolbox.getAddressFromMnemonic(phrase);

      return { ...toolbox, address };
    }

    case Chain.Polkadot:
    case Chain.Chainflip: {
      const { Network, getSubstrateToolbox, createKeyring } = await import(
        "@swapkit/toolboxes/substrate"
      );

      const signer = await createKeyring(phrase, Network[chain].prefix);
      const toolbox = await getSubstrateToolbox(chain, { signer });

      return { ...toolbox, address: signer.address };
    }

    case Chain.Solana: {
      const { getSolanaToolbox, createKeysForPath } = await import("@swapkit/toolboxes/solana");
      const keypair = await createKeysForPath({ phrase, derivationPath });
      const toolbox = getSolanaToolbox({ signer: keypair });

      const address = await toolbox.getAddressFromKeys(keypair);

      return {
        ...toolbox,
        address,
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

          const wallet = await getKeystoreWallet({
            chain,
            derivationPath,
            phrase,
          });

          addChain({ ...wallet, chain, walletType: WalletOption.KEYSTORE });
        }),
      );

      return true;
    },
});

export const KEYSTORE_SUPPORTED_CHAINS = getWalletSupportedChains(keystoreWallet);

export * from "./helpers";
