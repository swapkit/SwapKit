import {
  Chain,
  CosmosChains,
  type DerivationPathArray,
  EVMChains,
  filterSupportedChains,
  NetworkDerivationPath,
  UTXOChains,
  updateDerivationPath,
  WalletOption,
} from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";

export const keystoreWallet = createWallet({
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectKeystore(
      chains: Chain[],
      phrase: string,
      derivationPathMapOrIndex?: { [chain in Chain]?: DerivationPathArray } | number,
    ) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
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

          const { getToolbox } = await import("@swapkit/toolboxes");

          const toolbox = await getToolbox(chain, { derivationPath, phrase });
          const address = (await toolbox.getAddress()) || "";

          const wallet = { ...toolbox, address };

          addChain({ ...wallet, chain, walletType: WalletOption.KEYSTORE });
        }),
      );

      return true;
    },
  name: "connectKeystore",
  supportedChains: [
    ...EVMChains,
    ...UTXOChains,
    ...CosmosChains.filter((chain) => chain !== Chain.Harbor),
    Chain.Polkadot,
    Chain.Chainflip,
    Chain.Ripple,
    Chain.Solana,
    Chain.Tron,
    Chain.Near,
  ],
  walletType: WalletOption.KEYSTORE,
});

export const KEYSTORE_SUPPORTED_CHAINS = getWalletSupportedChains(keystoreWallet);

export * from "./helpers";
