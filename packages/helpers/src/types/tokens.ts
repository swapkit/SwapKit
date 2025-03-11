import type { tokenLists } from "@swapkit/helpers/tokens";

export type TokenTax = { buy: number; sell: number };

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

export type TokenNames = (typeof tokenLists)[ListOfTokens]["tokens"][number]["identifier"];
