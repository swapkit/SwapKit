import type { Signer as InjectedSigner } from "@polkadot/api/types";
import type { ProviderInterface } from "@polkadot/rpc-provider/types";
import type { ExtDef } from "@polkadot/types/extrinsic/signedExtensions/types";
import type { KeypairType } from "@polkadot/util-crypto/types";
import type { AssetValue, SubstrateChain } from "@swapkit/helpers";

type This = typeof globalThis;

const polkadotNetwork = {
  prefix: 0,
  network: "polkadot",
  displayName: "Polkadot Relay Chain",
  symbols: ["DOT"],
  decimals: [10],
  standardAccount: "*25519",
  website: "https://polkadot.network",
};

const chainflipNetwork = {
  prefix: 2112,
  network: "chainflip",
  displayName: "Chainflip",
  symbols: ["FLIP"],
  decimals: [18],
  standardAccount: "*25519",
  website: "https://chainflip.io/",
};

const subtrateNetwork = {
  prefix: 42,
  network: "substrate",
  displayName: "Substrate",
  symbols: [],
  decimals: [],
  standardAccount: "*25519",
  website: "https://substrate.io/",
};

export const Network: Record<SubstrateChain | "GENERIC", SubstrateNetwork> = {
  DOT: polkadotNetwork,
  FLIP: chainflipNetwork,
  GENERIC: subtrateNetwork,
};

export type SubstrateNetwork =
  | typeof polkadotNetwork
  | typeof chainflipNetwork
  | typeof subtrateNetwork;

export type SubstrateTransferParams = {
  recipient: string;
  assetValue: AssetValue;
  from?: string;
};

export type Unsubcall = () => void;

export interface InjectedAccount {
  address: string;
  genesisHash?: string | null;
  name?: string;
  type?: KeypairType;
}

export interface InjectedAccounts {
  get: (anyType?: boolean) => Promise<InjectedAccount[]>;
  subscribe: (cb: (accounts: InjectedAccount[]) => void | Promise<void>) => Unsubcall;
}
export interface InjectedExtensionInfo {
  name: string;
  version: string;
}
export interface ProviderMeta {
  network: string;
  node: "full" | "light";
  source: string;
  transport: string;
}
export interface MetadataDefBase {
  chain: string;
  genesisHash: string;
  icon: string;
  ss58Format: number;
  chainType?: "substrate" | "ethereum";
}
export interface MetadataDef extends MetadataDefBase {
  color?: string;
  specVersion: number;
  tokenDecimals: number;
  tokenSymbol: string;
  types: Record<string, Record<string, string> | string>;
  metaCalls?: string;
  userExtensions?: ExtDef;
}
export interface InjectedMetadataKnown {
  genesisHash: string;
  specVersion: number;
}
export interface InjectedMetadata {
  get: () => Promise<InjectedMetadataKnown[]>;
  provide: (definition: MetadataDef) => Promise<boolean>;
}
export type ProviderList = Record<string, ProviderMeta>;
export interface InjectedProvider extends ProviderInterface {
  listProviders: () => Promise<ProviderList>;
  startProvider: (key: string) => Promise<ProviderMeta>;
}
export interface InjectedProviderWithMeta {
  provider: InjectedProvider;
  meta: ProviderMeta;
}
export interface Injected {
  accounts: InjectedAccounts;
  metadata?: InjectedMetadata;
  provider?: InjectedProvider;
  signer: InjectedSigner;
}
export interface InjectedWindowProvider {
  connect?: (origin: string) => Promise<InjectedExtension>;
  enable?: (origin: string) => Promise<Injected>;
  version?: string;
}
export interface InjectedWindow extends This {
  injectedWeb3: Record<string, InjectedWindowProvider>;
}
export type InjectedExtension = InjectedExtensionInfo & Injected;
