import { match } from "ts-pattern";
import type * as tokenLists from "./lists";

type ListOfTokens = Exclude<
  keyof typeof tokenLists,
  | "JupiterList"
  | "CamelotV3List"
  | "OneInchList"
  | "OpenOceanV2List"
  | "PancakeswapList"
  | "PangolinList"
  | "SushiswapList"
  | "TraderjoeV2List"
>;

export type TokenLists = {
  camelot: typeof tokenLists.CamelotV3List;
  caviar: typeof tokenLists.CaviarV1List;
  chainflip: typeof tokenLists.ChainflipList;
  jupiter: typeof tokenLists.JupiterList;
  garden: typeof tokenLists.GardenList;
  harbor: typeof tokenLists.HarborList;
  mayachain: typeof tokenLists.MayaList;
  near: typeof tokenLists.NearList;
  okx: typeof tokenLists.OkxList;
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
export type TokenTax = { buy: number; sell: number };
export type TokenNames = (typeof tokenLists)[ListOfTokens]["tokens"][number]["identifier"];

const defaultLists = [
  "camelot",
  "caviar",
  "chainflip",
  "jupiter",
  "mayachain",
  "garden",
  "harbor",
  "near",
  "okx",
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
    .with("camelot", () => import("./lists/camelot_v3"))
    .with("caviar", () => import("./lists/caviar_v1"))
    .with("chainflip", () => import("./lists/chainflip"))
    .with("garden", () => import("./lists/garden"))
    .with("harbor", () => import("./lists/harbor"))
    .with("jupiter", () => import("./lists/jupiter"))
    .with("mayachain", () => import("./lists/mayachain"))
    .with("near", () => import("./lists/near"))
    .with("okx", () => import("./lists/okx"))
    .with("oneinch", () => import("./lists/oneinch"))
    .with("openocean", () => import("./lists/openocean_v2"))
    .with("pancakeswap", () => import("./lists/pancakeswap"))
    .with("pangolin", () => import("./lists/pangolin_v1"))
    .with("sushiswap", () => import("./lists/sushiswap_v2"))
    .with("thorchain", () => import("./lists/thorchain"))
    .with("traderjoe", () => import("./lists/traderjoe_v2"))
    .with("uniswap", () => import("./lists/uniswap_v2"))
    .with("uniswapv3", () => import("./lists/uniswap_v3"))
    .otherwise(() => {
      console.warn(`Token list ${listName} not found`);
      return { list: [] };
    });

  return list as unknown as TokenLists[T];
}
