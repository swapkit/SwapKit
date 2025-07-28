import { kyberRouter } from "./kyber";
import { oneInchRouter } from "./oneinch";
import { pancakeSwapRouter } from "./pancakeswap";
import { pangolinRouter } from "./pangolin";
import { sushiswapRouter } from "./sushiswap";
import { traderJoeRouter } from "./traderJoe";
import { uniswapv2Router } from "./uniswapv2";
import { uniswapv3Router } from "./uniswapv3";
import { woofiRouter } from "./woofi";

type AbiTypes =
  | typeof kyberRouter
  | typeof oneInchRouter
  | typeof pancakeSwapRouter
  | typeof pangolinRouter
  | typeof sushiswapRouter
  | typeof traderJoeRouter
  | typeof uniswapv2Router
  | typeof uniswapv3Router
  | typeof woofiRouter;

export enum DEX_CONTRACT_ADDRESS {
  // AVAX
  TRADERJOE = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
  PANGOLIN = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106",
  WOOFI = "0xC22FBb3133dF781E6C25ea6acebe2D2Bb8CeA2f9",
  ONEINCH_AVAX = "0x1111111254fb6c44bAC0beD2854e76F90643097d",
  KYBER_AVAX = "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",

  // BSC
  PANCAKESWAP_BSC = "0x10ED43C718714eb63d5aA57B78B54704E256024E",

  // ETH
  ONEINCH_ETH = "0x1111111254fb6c44bac0bed2854e76f90643097d",
  PANCAKESWAP_ETH = "0xEfF92A263d31888d860bD50809A8D171709b7b1c",
  KYBER_ETH = "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  SUSHISWAP = "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f",
  UNISWAP_V2 = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  UNISWAP_V3 = "0xE592427A0AEce92De3Edee1F18E0157C05861564",
}

export const lowercasedRouterAbiMapping = {
  // AVAX
  [DEX_CONTRACT_ADDRESS.PANGOLIN.toLowerCase()]: pangolinRouter,
  [DEX_CONTRACT_ADDRESS.WOOFI.toLowerCase()]: woofiRouter,
  [DEX_CONTRACT_ADDRESS.TRADERJOE.toLowerCase()]: traderJoeRouter,
  [DEX_CONTRACT_ADDRESS.ONEINCH_AVAX.toLowerCase()]: oneInchRouter,
  [DEX_CONTRACT_ADDRESS.KYBER_AVAX.toLowerCase()]: kyberRouter,
  // BSC
  [DEX_CONTRACT_ADDRESS.PANCAKESWAP_BSC.toLowerCase()]: pancakeSwapRouter,
  // ETH
  [DEX_CONTRACT_ADDRESS.KYBER_ETH.toLowerCase()]: kyberRouter,
  [DEX_CONTRACT_ADDRESS.SUSHISWAP.toLowerCase()]: sushiswapRouter,
  [DEX_CONTRACT_ADDRESS.PANCAKESWAP_ETH.toLowerCase()]: pancakeSwapRouter,
  [DEX_CONTRACT_ADDRESS.UNISWAP_V2.toLowerCase()]: uniswapv2Router,
  [DEX_CONTRACT_ADDRESS.UNISWAP_V3.toLowerCase()]: uniswapv3Router,
  [DEX_CONTRACT_ADDRESS.ONEINCH_ETH.toLowerCase()]: oneInchRouter,
} as Record<string, AbiTypes>;
