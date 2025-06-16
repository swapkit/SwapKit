import {
  Chain,
  CosmosChains,
  type DerivationPathArray,
  EVMChains,
  NetworkDerivationPath,
  UTXOChains,
  WalletOption,
  createWallet,
  filterSupportedChains,
  updateDerivationPath,
} from "@swapkit/helpers";
import { getWalletSupportedChains } from "../utils";

export const keystoreWallet = createWallet({
  name: "connectKeystore",
  walletType: WalletOption.KEYSTORE,
  supportedChains: [
    ...EVMChains,
    ...UTXOChains,
    ...CosmosChains,
    Chain.Polkadot,
    Chain.Chainflip,
    Chain.Ripple,
    Chain.Solana,
    Chain.Tron,
    Chain.Near,
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

          const derivationPath: DerivationPathArray =
            derivationPathFromMap ||
            updateDerivationPath(derivationArrayToUpdate, { index: derivationPathIndex });

          const { getToolbox } = await import("@swapkit/toolboxes");

          const toolbox = await getToolbox(chain, { phrase, derivationPath });
          const address = (await toolbox.getAddress()) || "";

          const wallet = { ...toolbox, address };

          addChain({ ...wallet, chain, walletType: WalletOption.KEYSTORE });
        }),
      );

      return true;
    },
});

export const KEYSTORE_SUPPORTED_CHAINS = getWalletSupportedChains(keystoreWallet);

export * from "./helpers";
