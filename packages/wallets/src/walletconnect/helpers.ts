import { Chain, type CosmosChain, type EVMChain, SKConfig } from "@swapkit/helpers";

import {
  ARBITRUM_ONE_MAINNET_ID,
  AURORA_MAINNET_ID,
  AVALANCHE_MAINNET_ID,
  BASE_MAINNET_ID,
  BERACHAIN_MAINNET_ID,
  BSC_MAINNET_ID,
  COSMOS_HUB_MAINNET_ID,
  ETHEREUM_MAINNET_ID,
  KUJIRA_MAINNET_ID,
  MAYACHAIN_MAINNET_ID,
  MONAD_MAINNET_ID,
  NEAR_MAINNET_ID,
  NEAR_TESTNET_ID,
  OPTIMISM_MAINNET_ID,
  POLYGON_MAINNET_ID,
  THORCHAIN_MAINNET_ID,
  TRON_MAINNET_ID,
} from "./constants";

export const getAddressByChain = (
  chain: EVMChain | Exclude<CosmosChain, typeof Chain.Noble> | typeof Chain.Near | typeof Chain.Tron,
  accounts: string[],
) => {
  const account = accounts.find((account) => account.startsWith(chainToChainId(chain))) || "";
  const address = account?.split(":")?.[2];

  return address || "";
};

export const chainToChainId = (chain: Chain) => {
  switch (chain) {
    case Chain.Avalanche:
      return AVALANCHE_MAINNET_ID;
    case Chain.Aurora:
      return AURORA_MAINNET_ID;
    case Chain.Base:
      return BASE_MAINNET_ID;
    case Chain.BinanceSmartChain:
      return BSC_MAINNET_ID;
    case Chain.Berachain:
      return BERACHAIN_MAINNET_ID;
    case Chain.Monad:
      return MONAD_MAINNET_ID;
    case Chain.Ethereum:
      return ETHEREUM_MAINNET_ID;
    case Chain.THORChain:
      return THORCHAIN_MAINNET_ID;
    case Chain.Arbitrum:
      return ARBITRUM_ONE_MAINNET_ID;
    case Chain.Optimism:
      return OPTIMISM_MAINNET_ID;
    case Chain.Polygon:
      return POLYGON_MAINNET_ID;
    case Chain.Maya:
      return MAYACHAIN_MAINNET_ID;
    case Chain.Cosmos:
      return COSMOS_HUB_MAINNET_ID;
    case Chain.Kujira:
      return KUJIRA_MAINNET_ID;
    case Chain.Near: {
      // Use testnet if stagenet is enabled
      const { isStagenet } = SKConfig.get("envs");
      return isStagenet ? NEAR_TESTNET_ID : NEAR_MAINNET_ID;
    }
    case Chain.Tron:
      return TRON_MAINNET_ID;
    default:
      return "";
  }
};
