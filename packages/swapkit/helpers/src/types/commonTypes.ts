import type { RadixNetwork } from "@swapkit/toolbox-radix";
import type { Chain, WalletChain } from "./chains";
import type { ChainApis } from "./sdk";
import type { ChainWallet } from "./wallet";

/**
 * @optional for swapkit API access
 */
type SwapkitConfig = {
  swapkitConfig?: {
    isDev?: boolean;
    swapkitApiKey?: string;
    useHashedApiKey?: boolean;
    referer?: string;
  };
  swapkitApiKey?: string;
};

export type ConnectConfig = SwapkitConfig & {
  stagenet?: boolean;
  /**
   * @required for AVAX & BSC
   */
  thorswapApiKey?: string;
  /**
   * @required for AVAX & BSC
   */
  covalentApiKey?: string;
  /**
   * @required for ETH
   */
  ethplorerApiKey?: string;
  /**
   * @required for BTC, BCH, LTC, DOGE
   */
  blockchairApiKey?: string;
  /**
   * @required for Walletconnect
   */
  walletConnectProjectId?: string;
  /**
   * @optional for Trezor config
   */
  trezorManifest?: {
    email: string;
    appUrl: string;
  };
  /**
   * @optional for KeepKey config
   */
  keepkeyConfig?: {
    apiKey: string;
    pairingInfo: {
      name: string;
      imageUrl: string;
      basePath: string;
      url: string;
    };
  };
  /**
   * @deprecated use chainflipBrokerConfig
   * @optional for setting the chainflip broker url
   */
  chainflipBrokerUrl?: string;
  /**
   * @optional for setting the chainflip broker url
   */
  chainflipBrokerConfig?: {
    useChainflipSDKBroker?: boolean;
    chainflipBrokerUrl: string;
  };
  /**
   * @optional for setting the radix wallet
   */
  radixDappConfig?: {
    dAppDefinitionAddress: string;
    applicationName: string;
    applicationVersion: string;
    network: RadixNetwork;
  };

  /**
   * @optional for setting the kado api key
   */
  kadoApiKey?: string;
};

export type ConnectWalletParams<M = { [key in string]: any }> = {
  addChain: <T extends WalletChain>(params: ChainWallet<T> & M) => void;
  apis: ChainApis;
  config: ConnectConfig;
  rpcUrls: { [chain in Chain]?: string };
};

export type Witness = {
  value: number;
  script: Buffer;
};

export enum QuoteMode {
  TC_SUPPORTED_TO_TC_SUPPORTED = "TC-TC",
  TC_SUPPORTED_TO_ETH = "TC-ERC20",
  TC_SUPPORTED_TO_AVAX = "TC-ARC20",
  TC_SUPPORTED_TO_BSC = "TC-BEP20",
  ETH_TO_TC_SUPPORTED = "ERC20-TC",
  ETH_TO_ETH = "ERC20-ERC20",
  ETH_TO_AVAX = "ERC20-ARC20",
  ETH_TO_BSC = "ERC20-BEP20",
  AVAX_TO_TC_SUPPORTED = "ARC20-TC",
  AVAX_TO_ETH = "ARC20-ERC20",
  AVAX_TO_AVAX = "ARC20-ARC20",
  AVAX_TO_BSC = "ARC20-BEP20",
  BSC_TO_TC_SUPPORTED = "BEP20-TC",
  BSC_TO_ETH = "BEP20-ERC20",
  BSC_TO_AVAX = "BEP20-ARC20",
  BSC_TO_BSC = "BEP20-BEP20",
}

export type Asset = {
  chain: Chain;
  symbol: string;
  ticker: string;
  synth?: boolean;
};

export const AGG_SWAP = [QuoteMode.ETH_TO_ETH, QuoteMode.AVAX_TO_AVAX, QuoteMode.BSC_TO_BSC];

export const SWAP_IN = [
  QuoteMode.ETH_TO_TC_SUPPORTED,
  QuoteMode.ETH_TO_AVAX,
  QuoteMode.ETH_TO_BSC,
  QuoteMode.AVAX_TO_TC_SUPPORTED,
  QuoteMode.AVAX_TO_ETH,
  QuoteMode.AVAX_TO_BSC,
  QuoteMode.BSC_TO_TC_SUPPORTED,
  QuoteMode.BSC_TO_ETH,
  QuoteMode.BSC_TO_AVAX,
];

export const SWAP_OUT = [
  QuoteMode.TC_SUPPORTED_TO_TC_SUPPORTED,
  QuoteMode.TC_SUPPORTED_TO_ETH,
  QuoteMode.TC_SUPPORTED_TO_AVAX,
  QuoteMode.TC_SUPPORTED_TO_BSC,
];
