import {
  Chain,
  type DerivationPathArray,
  NetworkDerivationPath,
  SKConfig,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";

import { KeepKeySdk } from "@keepkey/keepkey-sdk";
export type { PairingInfo } from "@keepkey/keepkey-sdk";

import { getWalletSupportedChains } from "../utils";
import { cosmosWalletMethods } from "./chains/cosmos";
import { KeepKeySigner } from "./chains/evm";
import { mayachainWalletMethods } from "./chains/mayachain";
import { thorchainWalletMethods } from "./chains/thorchain";
import { utxoWalletMethods } from "./chains/utxo";

export const keepkeyWallet = createWallet({
  name: "connectKeepkey",
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dogecoin,
    Chain.Dash,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
    Chain.Maya,
  ],
  walletType: WalletOption.KEEPKEY,
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectKeepkey(
      chains: Chain[],
      derivationPathMap?: Record<Chain, DerivationPathArray>,
    ) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });
      const config = SKConfig.get("integrations").keepKey;

      if (!config) throw new Error("KeepKey config not found");

      await checkAndLaunch();

      const keepkeyConfig = { ...config, apiKey: SKConfig.get("apiKeys").keepKey };
      const keepKeySdk = await KeepKeySdk.create(keepkeyConfig);

      await Promise.all(
        filteredChains.map(async (chain) => {
          const walletMethods = await getWalletMethods({
            chain,
            derivationPath: derivationPathMap?.[chain] || NetworkDerivationPath[chain],
            sdk: keepKeySdk,
          });
          walletMethods.address;

          addChain({ ...walletMethods, chain, walletType: WalletOption.KEEPKEY });
        }),
      );
      return true;
    },
});

export const KEEPKEY_SUPPORTED_CHAINS = getWalletSupportedChains(keepkeyWallet);

async function getWalletMethods({
  sdk,
  chain,
  derivationPath,
}: { sdk: KeepKeySdk; chain: Chain; derivationPath?: DerivationPathArray }) {
  const { getProvider, getEvmToolbox } = await import("@swapkit/toolboxes/evm");

  switch (chain) {
    case Chain.BinanceSmartChain:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Avalanche:
    case Chain.Ethereum: {
      const provider = await getProvider(chain);
      const signer = new KeepKeySigner({ sdk, chain, derivationPath, provider });
      const address = await signer.getAddress();
      const toolbox = await getEvmToolbox(chain, { provider, signer });

      return { address, ...toolbox };
    }
    case Chain.Cosmos: {
      return cosmosWalletMethods({ sdk, derivationPath });
    }
    case Chain.THORChain: {
      return thorchainWalletMethods({ sdk, derivationPath });
    }
    case Chain.Maya: {
      return mayachainWalletMethods({ sdk, derivationPath });
    }
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      return utxoWalletMethods({ sdk, chain, derivationPath });
    }
    default:
      throw new Error(`Chain not supported ${chain}`);
  }
}

// kk-sdk docs: https://medium.com/@highlander_35968/building-on-the-keepkey-sdk-2023fda41f38
// test spec: if offline, launch keepkey-bridge
async function checkAndLaunch(attempts = 0) {
  if (attempts >= 3) {
    alert(
      "KeepKey desktop is required for keepkey-sdk, please go to https://keepkey.com/get-started",
    );
  }
  const isAvailable = await checkKeepkeyAvailability();

  if (!isAvailable) {
    window.location.assign("keepkey://launch");
    await new Promise((resolve) => setTimeout(resolve, 30000));
    checkAndLaunch(attempts + 1);
  }
}

async function checkKeepkeyAvailability(spec = "http://localhost:1646/spec/swagger.json") {
  try {
    const response = await fetch(spec);
    return response.status === 200;
  } catch (error) {
    console.error(error);
    return false;
  }
}
