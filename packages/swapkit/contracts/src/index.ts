import { avaxGeneric } from "./abis/avaxGeneric";
import { avaxWoofi } from "./abis/avaxWoofi";
import { bscGeneric } from "./abis/bscGeneric";
import { erc20ABI } from "./abis/erc20";
import { ethGeneric } from "./abis/ethGeneric";
import { MayaArbitrumVaultAbi, MayaEthereumVaultAbi } from "./abis/mayaEvmVaults";
import { pancakeV2 } from "./abis/pancakeV2";
import { pangolin } from "./abis/pangolin";
import { sushiswap } from "./abis/sushiswap";
import {
  TCAvalancheDepositABI,
  TCBaseDepositABI,
  TCBscDepositABI,
  TCEthereumVaultAbi,
} from "./abis/tcEthVault";
import { traderJoe } from "./abis/traderJoe";
import { uniswapV2 } from "./abis/uniswapV2";
import { uniswapV2Leg } from "./abis/uniswapV2Leg";
import { uniswapV3_100 } from "./abis/uniswapV3_100";
import { uniswapV3_500 } from "./abis/uniswapV3_500";
import { uniswapV3_3000 } from "./abis/uniswapV3_3000";
import { uniswapV3_10000 } from "./abis/uniswapV3_10000";
import { lowercasedRouterAbiMapping } from "./routers/index";

type AbiTypes =
  | typeof avaxGeneric
  | typeof avaxWoofi
  | typeof bscGeneric
  | typeof ethGeneric
  | typeof sushiswap
  | typeof uniswapV2
  | typeof pancakeV2
  | typeof uniswapV2Leg
  | typeof uniswapV3_100
  | typeof uniswapV3_10000
  | typeof uniswapV3_3000
  | typeof uniswapV3_500;

export enum AGG_CONTRACT_ADDRESS {
  // AVAX
  PANGOLIN = "0x942c6dA485FD6cEf255853ef83a149d43A73F18a",
  AVAX_GENERIC = "0x7C38b8B2efF28511ECc14a621e263857Fb5771d3",
  AVAX_WOOFI = "0x5505BE604dFA8A1ad402A71f8A357fba47F9bf5a",
  AVAX_TRADER_JOE = "0x3b7DbdD635B99cEa39D3d95Dbd0217F05e55B212",

  // BSC
  BSC_GENERIC = "0xB6fA6f1DcD686F4A573Fd243a6FABb4ba36Ba98c",
  BSC_PANCAKE_V2 = "0x30912B38618D3D37De3191A4FFE982C65a9aEC2E",

  // ETH
  ETH_GENERIC = "0xd31f7e39afECEc4855fecc51b693F9A0Cec49fd2",
  UNISWAP_V2 = "0x86904Eb2b3c743400D03f929F2246EfA80B91215",
  SUSHISWAP = "0xbf365e79aA44A2164DA135100C57FDB6635ae870",
  UNISWAP_V3_100 = "0xBd68cBe6c247e2c3a0e36B8F0e24964914f26Ee8",
  UNISWAP_V3_500 = "0xe4ddca21881bac219af7f217703db0475d2a9f02",
  UNISWAP_V3_3000 = "0x11733abf0cdb43298f7e949c930188451a9a9ef2",
  UNISWAP_V3_10000 = "0xb33874810e5395eb49d8bd7e912631db115d5a03",
  UNISWAP_V2_LEG = "0x3660dE6C56cFD31998397652941ECe42118375DA",
}

export {
  erc20ABI,
  TCEthereumVaultAbi,
  TCAvalancheDepositABI,
  TCBscDepositABI,
  TCBaseDepositABI,
  MayaArbitrumVaultAbi,
  MayaEthereumVaultAbi,
};

export const lowercasedGenericAbiMappings = {
  [AGG_CONTRACT_ADDRESS.AVAX_GENERIC.toLowerCase()]: avaxGeneric,
  [AGG_CONTRACT_ADDRESS.BSC_GENERIC.toLowerCase()]: bscGeneric,
  [AGG_CONTRACT_ADDRESS.ETH_GENERIC.toLowerCase()]: ethGeneric,
} as Record<string, AbiTypes>;

export const lowercasedContractAbiMapping = {
  ...lowercasedRouterAbiMapping,
  ...lowercasedGenericAbiMappings,
  // AVAX
  [AGG_CONTRACT_ADDRESS.PANGOLIN.toLowerCase()]: pangolin,
  [AGG_CONTRACT_ADDRESS.AVAX_WOOFI.toLowerCase()]: avaxWoofi,
  [AGG_CONTRACT_ADDRESS.AVAX_TRADER_JOE.toLowerCase()]: traderJoe,
  // BSC
  [AGG_CONTRACT_ADDRESS.BSC_PANCAKE_V2.toLowerCase()]: pancakeV2,
  // ETH
  [AGG_CONTRACT_ADDRESS.SUSHISWAP.toLowerCase()]: sushiswap,
  [AGG_CONTRACT_ADDRESS.UNISWAP_V2.toLowerCase()]: uniswapV2,
  [AGG_CONTRACT_ADDRESS.UNISWAP_V2_LEG.toLowerCase()]: uniswapV2Leg,
  [AGG_CONTRACT_ADDRESS.UNISWAP_V3_100.toLowerCase()]: uniswapV3_100,
  [AGG_CONTRACT_ADDRESS.UNISWAP_V3_500.toLowerCase()]: uniswapV3_500,
  [AGG_CONTRACT_ADDRESS.UNISWAP_V3_3000.toLowerCase()]: uniswapV3_3000,
  [AGG_CONTRACT_ADDRESS.UNISWAP_V3_10000.toLowerCase()]: uniswapV3_10000,
} as Record<string, AbiTypes>;
