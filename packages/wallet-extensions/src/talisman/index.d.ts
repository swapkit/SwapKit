import { Chain } from "@swapkit/helpers";
export declare const talismanWallet: {
  connectTalisman: {
    connectWallet: (connectParams: {
      addChain: import("@swapkit/helpers").AddChainType;
    }) => (chains: Chain[]) => Promise<boolean>;
    supportedChains: (
      | Chain.Arbitrum
      | Chain.Avalanche
      | Chain.Base
      | Chain.BinanceSmartChain
      | Chain.Ethereum
      | Chain.Optimism
      | Chain.Polkadot
      | Chain.Chainflip
      | Chain.Polygon
    )[];
  };
};
export declare const TALISMAN_SUPPORTED_CHAINS: (
  | Chain.Arbitrum
  | Chain.Avalanche
  | Chain.Base
  | Chain.BinanceSmartChain
  | Chain.Ethereum
  | Chain.Optimism
  | Chain.Polkadot
  | Chain.Chainflip
  | Chain.Polygon
)[];
//# sourceMappingURL=index.d.ts.map
