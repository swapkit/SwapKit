import type { tokenLists } from "@swapkit/tokens";

export type TokenTax = { buy: number; sell: number };

export type TokenNames =
  | (typeof tokenLists)["CaviarV1List"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["ChainflipList"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["JupiterList"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["KadoList"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["MayaList"]["tokens"][number]["identifier"]
  // | (typeof tokenLists)['OciswapV1List']["tokens"][number]["identifier"]
  | (typeof tokenLists)["OneInchList"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["OpenOceanV2List"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["PancakeswapList"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["PangolinList"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["SushiswapList"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["ThorchainList"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["TraderjoeV2List"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["UniswapV2List"]["tokens"][number]["identifier"]
  | (typeof tokenLists)["UniswapV3List"]["tokens"][number]["identifier"];
