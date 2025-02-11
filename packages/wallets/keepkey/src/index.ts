import {
  Chain,
  type ConnectWalletParams,
  type DerivationPathArray,
  type EVMChain,
  WalletOption,
  filterSupportedChains,
  setRequestClientConfig,
} from "@swapkit/helpers";

import { KeepKeySdk } from "@keepkey/keepkey-sdk";
export type { PairingInfo } from "@keepkey/keepkey-sdk";

import { cosmosWalletMethods } from "./chains/cosmos";
import { KeepKeySigner } from "./chains/evm";
import { mayachainWalletMethods } from "./chains/mayachain";
import { thorchainWalletMethods } from "./chains/thorchain";
import { utxoWalletMethods } from "./chains/utxo";

export const KEEPKEY_SUPPORTED_CHAINS = [
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
] as const;

/*
 * KeepKey Wallet
 */
type KeepKeyOptions = {
  sdk: KeepKeySdk;
  apiClient?: any;
  rpcUrl?: string;
  ethplorerApiKey?: string;
  blockchairApiKey?: string;
  covalentApiKey?: string;
  chain: Chain;
  derivationPath?: DerivationPathArray;
};

const getWalletMethods = async ({
  sdk,
  apiClient,
  rpcUrl,
  chain,
  derivationPath,
  covalentApiKey,
  ethplorerApiKey,
  blockchairApiKey,
}: KeepKeyOptions) => {
  const { getProvider, getToolboxByChain } = await import("@swapkit/toolbox-evm");

  switch (chain) {
    case Chain.BinanceSmartChain:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Avalanche:
    case Chain.Ethereum: {
      if (chain === Chain.Ethereum && !ethplorerApiKey)
        throw new Error("Ethplorer API key not found");
      if (chain !== Chain.Ethereum && !covalentApiKey)
        throw new Error("Covalent API key not found");

      const provider = getProvider(chain as EVMChain, rpcUrl);
      const signer = new KeepKeySigner({
        sdk,
        chain,
        derivationPath,
        provider,
      });
      const address = await signer.getAddress();
      const evmParams = {
        api: apiClient,
        signer,
        provider,
        covalentApiKey: covalentApiKey as string,
        ethplorerApiKey: ethplorerApiKey as string,
      };

      return {
        address,
        ...getToolboxByChain(chain)(evmParams),
      };
    }
    case Chain.Cosmos: {
      return cosmosWalletMethods({ sdk, derivationPath, api: apiClient });
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
      return utxoWalletMethods({
        apiKey: blockchairApiKey,
        apiClient,
        sdk,
        chain,
        derivationPath,
      });
    }
    default:
      throw new Error(`Chain not supported ${chain}`);
  }
};

export const checkKeepkeyAvailability = async (
  spec = "http://localhost:1646/spec/swagger.json",
) => {
  try {
    const response = await fetch(spec);
    return response.status === 200;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// kk-sdk docs: https://medium.com/@highlander_35968/building-on-the-keepkey-sdk-2023fda41f38
// test spec: if offline, launch keepkey-bridge
const checkAndLaunch = async (attempts: number) => {
  if (attempts === 0) {
    alert(
      "KeepKey desktop is required for keepkey-sdk, please go to https://keepkey.com/get-started",
    );
  }
  const isAvailable = await checkKeepkeyAvailability();

  if (!isAvailable) {
    window.location.assign("keepkey://launch");
    await new Promise((resolve) => setTimeout(resolve, 30000));
    checkAndLaunch(attempts - 1);
  }
};

function connectKeepkey({
  apis,
  rpcUrls,
  addChain,
  config: {
    blockchairApiKey,
    covalentApiKey,
    ethplorerApiKey = "freekey",
    keepkeyConfig,
    thorswapApiKey,
  },
}: ConnectWalletParams) {
  return async function connectKeepkey(
    chains: Chain[],
    // @deprecated - use derivationPathMap instead
    derivationPaths?: DerivationPathArray[],
    derivationPathMap?: Record<Chain, DerivationPathArray>,
  ) {
    setRequestClientConfig({ apiKey: thorswapApiKey });
    if (!keepkeyConfig) throw new Error("KeepKey config not found");

    const supportedChains = filterSupportedChains(
      chains,
      KEEPKEY_SUPPORTED_CHAINS,
      WalletOption.KEEPKEY,
    );

    await checkAndLaunch(3);

    // Only build this once for all assets
    const keepKeySdk = await KeepKeySdk.create(keepkeyConfig);

    const toolboxPromises = supportedChains.map(async (chain, i) => {
      const derivationPath = Array.isArray(derivationPaths)
        ? derivationPaths[i]
        : derivationPathMap?.[chain];

      const walletMethods = await getWalletMethods({
        sdk: keepKeySdk,
        apiClient: apis[chain],
        rpcUrl: rpcUrls[chain],
        chain,
        derivationPath,
        covalentApiKey,
        ethplorerApiKey,
        blockchairApiKey,
      });

      addChain({
        ...walletMethods,
        balance: [],
        chain,
        walletType: WalletOption.KEEPKEY,
      });
    });

    await Promise.all(toolboxPromises);

    return true;
  };
}

export const keepkeyWallet = { connectKeepkey } as const;
