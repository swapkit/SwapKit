import { list as caviarV1 } from "./tokenLists/caviar_v1";
import { list as chainflip } from "./tokenLists/chainflip";
import { list as jupiter } from "./tokenLists/jupiter";
import { list as kado } from "./tokenLists/kado";
import { list as maya } from "./tokenLists/mayachain";
import { list as oneInch } from "./tokenLists/oneinch";
import { list as openOceanV2 } from "./tokenLists/openocean_v2";
import { list as pancakeswap } from "./tokenLists/pancakeswap";
import { list as pangolin } from "./tokenLists/pangolin_v1";
import { list as sushiswap } from "./tokenLists/sushiswap_v2";
import { list as thorchain } from "./tokenLists/thorchain";
import { list as traderjoeV2 } from "./tokenLists/traderjoe_v2";
import { list as uniswapV2 } from "./tokenLists/uniswap_v2";
import { list as uniswapV3 } from "./tokenLists/uniswap_v3";

import type { TokenList } from "./types";

export const CaviarV1List = caviarV1;
export const ChainflipList = chainflip;
export const JupiterList = jupiter;
export const KadoList = kado;
export const MayaList = maya;
export const OneInchList = oneInch;
export const OpenOceanV2List = openOceanV2;
export const PancakeswapList = pancakeswap;
export const PangolinList = pangolin;
export const SushiswapList = sushiswap;
export const ThorchainList = thorchain;
export const TraderjoeV2List = traderjoeV2;
export const UniswapV2List = uniswapV2;
export const UniswapV3List = uniswapV3;

export const tokenLists: Record<string, TokenList> = {
  CaviarV1List,
  ChainflipList,
  JupiterList,
  KadoList,
  MayaList,
  OneInchList,
  OpenOceanV2List,
  PancakeswapList,
  PangolinList,
  SushiswapList,
  ThorchainList,
  TraderjoeV2List,
  UniswapV2List,
  UniswapV3List,
};
