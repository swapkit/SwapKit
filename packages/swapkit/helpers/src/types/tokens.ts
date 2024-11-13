import type {
  CaviarV1List,
  ChainflipList,
  JupiterList,
  MayaList,
  //   OciswapV1List,
  OneInchList,
  OpenOceanV2List,
  PancakeswapList,
  PangolinList,
  SushiswapList,
  ThorchainList,
  TraderjoeV2List,
  UniswapV2List,
  UniswapV3List,
} from "@swapkit/tokens";

export type TokenTax = { buy: number; sell: number };

export type TokenNames =
  | (typeof CaviarV1List)["tokens"][number]["identifier"]
  | (typeof ChainflipList)["tokens"][number]["identifier"]
  | (typeof JupiterList)["tokens"][number]["identifier"]
  | (typeof MayaList)["tokens"][number]["identifier"]
  //   | (typeof OciswapV1List)["tokens"][number]["identifier"]
  | (typeof OneInchList)["tokens"][number]["identifier"]
  | (typeof OpenOceanV2List)["tokens"][number]["identifier"]
  | (typeof PancakeswapList)["tokens"][number]["identifier"]
  | (typeof PangolinList)["tokens"][number]["identifier"]
  | (typeof SushiswapList)["tokens"][number]["identifier"]
  | (typeof ThorchainList)["tokens"][number]["identifier"]
  | (typeof TraderjoeV2List)["tokens"][number]["identifier"]
  | (typeof UniswapV2List)["tokens"][number]["identifier"]
  | (typeof UniswapV3List)["tokens"][number]["identifier"];
