import { match } from "ts-pattern";
import type * as tokenLists from "../tokens/lists";

export type TokenLists = {
  camelot: typeof tokenLists.CamelotV3List;
  caviar: typeof tokenLists.CaviarV1List;
  chainflip: typeof tokenLists.ChainflipList;
  jupiter: typeof tokenLists.JupiterList;
  mayachain: typeof tokenLists.MayaList;
  oneinch: typeof tokenLists.OneInchList;
  openocean: typeof tokenLists.OpenOceanV2List;
  pancakeswap: typeof tokenLists.PancakeswapList;
  pangolin: typeof tokenLists.PangolinList;
  sushiswap: typeof tokenLists.SushiswapList;
  thorchain: typeof tokenLists.ThorchainList;
  traderjoe: typeof tokenLists.TraderjoeV2List;
  uniswap: typeof tokenLists.UniswapV2List;
  uniswapv3: typeof tokenLists.UniswapV3List;
};

export type TokenListName = keyof TokenLists;

const defaultLists = [
  "camelot",
  "caviar",
  "chainflip",
  "jupiter",
  "mayachain",
  "oneinch",
  "openocean",
  "pancakeswap",
  "pangolin",
  "sushiswap",
  "thorchain",
  "traderjoe",
  "uniswap",
  "uniswapv3",
] as TokenListName[];

export async function loadTokenLists<T extends TokenListName[]>(pickedLists?: T) {
  const listsToLoad = pickedLists || defaultLists;
  const lists = {} as { [key in T[number]]: TokenLists[key] };

  for (const list of listsToLoad) {
    const tokenList = await loadTokenList(list);

    // @ts-expect-error - It's fine to do this because we know the type of the list
    lists[list] = tokenList;
  }

  return lists;
}

async function loadTokenList<T extends TokenListName>(listName: T): Promise<TokenLists[T]> {
  const { list } = await match(listName as TokenListName)
    .with("camelot", () => import("../tokens/lists/camelot_v3"))
    .with("caviar", () => import("../tokens/lists/caviar_v1"))
    .with("chainflip", () => import("../tokens/lists/chainflip"))
    .with("jupiter", () => import("../tokens/lists/jupiter"))
    .with("mayachain", () => import("../tokens/lists/mayachain"))
    .with("oneinch", () => import("../tokens/lists/oneinch"))
    .with("openocean", () => import("../tokens/lists/openocean_v2"))
    .with("pancakeswap", () => import("../tokens/lists/pancakeswap"))
    .with("pangolin", () => import("../tokens/lists/pangolin_v1"))
    .with("sushiswap", () => import("../tokens/lists/sushiswap_v2"))
    .with("thorchain", () => import("../tokens/lists/thorchain"))
    .with("traderjoe", () => import("../tokens/lists/traderjoe_v2"))
    .with("uniswap", () => import("../tokens/lists/uniswap_v2"))
    .with("uniswapv3", () => import("../tokens/lists/uniswap_v3"))
    .exhaustive();

  return list as unknown as TokenLists[T];
}
