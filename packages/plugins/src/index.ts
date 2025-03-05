import type { ChainflipPlugin } from "./chainflip";
import type { EVMPlugin } from "./evm";
import type { KadoPlugin } from "./kado";
import type { RadixPlugin } from "./radix";
import type { ThorchainPlugin } from "./thorchain";

export type * from "./chainflip/types";
export type * from "./thorchain/types";
export type * from "./kado/types";

export type SKPlugins = typeof ChainflipPlugin &
  typeof ThorchainPlugin &
  typeof KadoPlugin &
  typeof RadixPlugin &
  typeof EVMPlugin;

export type PluginName = keyof SKPlugins;
