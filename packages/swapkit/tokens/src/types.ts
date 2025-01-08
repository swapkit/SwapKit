import type { list as caviarV1 } from "./tokenLists/caviar_v1";
import type { list as chainflip } from "./tokenLists/chainflip";
import type { list as jupiter } from "./tokenLists/jupiter";
import type { list as kado } from "./tokenLists/kado";
import type { list as maya } from "./tokenLists/mayachain";
import type { list as oneInch } from "./tokenLists/oneinch";
import type { list as openOceanV2 } from "./tokenLists/openocean_v2";
import type { list as pancakeswap } from "./tokenLists/pancakeswap";
import type { list as pangolin } from "./tokenLists/pangolin_v1";
import type { list as sushiswap } from "./tokenLists/sushiswap_v2";
import type { list as thorchain } from "./tokenLists/thorchain";
import type { list as traderjoeV2 } from "./tokenLists/traderjoe_v2";
import type { list as uniswapV2 } from "./tokenLists/uniswap_v2";
import type { list as uniswapV3 } from "./tokenLists/uniswap_v3";

export type TokenList =
  | typeof caviarV1
  | typeof chainflip
  | typeof jupiter
  | typeof kado
  | typeof maya
  | typeof oneInch
  | typeof openOceanV2
  | typeof pancakeswap
  | typeof pangolin
  | typeof sushiswap
  | typeof thorchain
  | typeof traderjoeV2
  | typeof uniswapV2
  | typeof uniswapV3;
