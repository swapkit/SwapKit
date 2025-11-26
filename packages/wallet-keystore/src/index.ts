import {
  Chain,
  CosmosChains,
  type DerivationPathArray,
  EVMChains,
  filterSupportedChains,
  NetworkDerivationPath,
  SubstrateChains,
  UTXOChains,
  updateDerivationPath,
  WalletOption,
} from "@swapkit/helpers";
import type { FullWallet } from "@swapkit/toolboxes";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";

export {
  decryptFromKeystore,
  encryptToKeyStore,
  generatePhrase,
  type Keystore,
  validatePhrase,
} from "./helpers";

export const keystoreWallet = createWallet({
  connect: ({ addChain }) =>
    async function connectKeystore(
      chains: Chain[],
      phrase: string,
      derivationPathMapOrIndex?: { [chain in Chain]?: DerivationPathArray } | number,
    ) {
      const wallets = await createKeystoreWallet({ chains, derivationPathMapOrIndex, phrase });

      for (const wallet of Object.values(wallets)) {
        addChain({ ...wallet, chain: wallet.chain, walletType: WalletOption.KEYSTORE });
      }

      return true;
    },
  name: "connectKeystore",
  supportedChains: [
    ...EVMChains,
    ...UTXOChains,
    ...CosmosChains.filter((chain) => chain !== Chain.Harbor),
    ...SubstrateChains,
    Chain.Cardano,
    Chain.Polkadot,
    Chain.Chainflip,
    Chain.Ripple,
    Chain.Solana,
    Chain.Sui,
    Chain.Ton,
    Chain.Tron,
    Chain.Near,
  ],
  walletType: WalletOption.KEYSTORE,
});

export const KEYSTORE_SUPPORTED_CHAINS = getWalletSupportedChains(keystoreWallet);

export async function createKeystoreWallet<T extends Chain[]>({
  chains,
  phrase,
  derivationPathMapOrIndex,
}: {
  chains: T;
  phrase: string;
  derivationPathMapOrIndex?: { [chain in Chain]?: DerivationPathArray } | number;
}) {
  const filteredChains = filterSupportedChains({
    chains,
    supportedChains: KEYSTORE_SUPPORTED_CHAINS,
    walletType: WalletOption.KEYSTORE,
  });

  const wallets = await Promise.all(
    filteredChains.map(async (chain) => {
      const { getToolbox } = await import("@swapkit/toolboxes");

      const derivationPathIndex = typeof derivationPathMapOrIndex === "number" ? derivationPathMapOrIndex : 0;
      const derivationPathFromMap =
        derivationPathMapOrIndex && typeof derivationPathMapOrIndex === "object"
          ? derivationPathMapOrIndex[chain]
          : undefined;

      const derivationArrayToUpdate = NetworkDerivationPath[chain].slice(
        0,
        chain === Chain.Solana ? 4 : 5,
      ) as DerivationPathArray;

      const derivationPath: DerivationPathArray =
        derivationPathFromMap || updateDerivationPath(derivationArrayToUpdate, { index: derivationPathIndex });

      const toolbox = await getToolbox(chain, { derivationPath, phrase });
      const address = (await toolbox.getAddress()) || "";
      const wallet = { ...toolbox, address, chain };

      return wallet;
    }),
  );

  return wallets.reduce(
    (acc, wallet) => {
      acc[wallet.chain as T[number]] = wallet as FullWallet[T[number]];
      return acc;
    },
    {} as { [key in T[number]]: FullWallet[key] },
  );
}
