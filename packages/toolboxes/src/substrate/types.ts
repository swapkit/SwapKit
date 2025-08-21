import type { Signer as InjectedSigner } from "@polkadot/api/types";
import type { ProviderInterface } from "@polkadot/rpc-provider/types";
import type { ExtDef } from "@polkadot/types/extrinsic/signedExtensions/types";
import type { KeypairType } from "@polkadot/util-crypto/types";
import type { GenericTransferParams, SubstrateChain } from "@swapkit/helpers";

const polkadotNetwork = {
  decimals: [10],
  displayName: "Polkadot Relay Chain",
  network: "polkadot",
  prefix: 0,
  standardAccount: "*25519",
  symbols: ["DOT"],
  website: "https://polkadot.network",
};

const chainflipNetwork = {
  decimals: [18],
  displayName: "Chainflip",
  network: "chainflip",
  prefix: 2112,
  standardAccount: "*25519",
  symbols: ["FLIP"],
  website: "https://chainflip.io/",
};

const subtrateNetwork = {
  decimals: [],
  displayName: "Substrate",
  network: "substrate",
  prefix: 42,
  standardAccount: "*25519",
  symbols: [],
  website: "https://substrate.io/",
};

export const SubstrateNetwork: Record<SubstrateChain | "GENERIC", SubstrateNetwork> = {
  DOT: polkadotNetwork,
  FLIP: chainflipNetwork,
  GENERIC: subtrateNetwork,
};

export type SubstrateNetwork = typeof polkadotNetwork | typeof chainflipNetwork | typeof subtrateNetwork;

export type SubstrateTransferParams = GenericTransferParams & { sender?: string };

type Unsubcall = () => void;

interface InjectedAccount {
  address: string;
  genesisHash?: string | null;
  name?: string;
  type?: KeypairType;
}

interface InjectedAccounts {
  get: (anyType?: boolean) => Promise<InjectedAccount[]>;
  subscribe: (cb: (accounts: InjectedAccount[]) => void | Promise<void>) => Unsubcall;
}
interface InjectedExtensionInfo {
  name: string;
  version: string;
}
interface ProviderMeta {
  network: string;
  node: "full" | "light";
  source: string;
  transport: string;
}
interface MetadataDefBase {
  chain: string;
  genesisHash: string;
  icon: string;
  ss58Format: number;
  chainType?: "substrate" | "ethereum";
}
interface MetadataDef extends MetadataDefBase {
  color?: string;
  specVersion: number;
  tokenDecimals: number;
  tokenSymbol: string;
  types: Record<string, Record<string, string> | string>;
  metaCalls?: string;
  userExtensions?: ExtDef;
}
interface InjectedMetadataKnown {
  genesisHash: string;
  specVersion: number;
}
interface InjectedMetadata {
  get: () => Promise<InjectedMetadataKnown[]>;
  provide: (definition: MetadataDef) => Promise<boolean>;
}
type ProviderList = Record<string, ProviderMeta>;

interface InjectedProvider extends ProviderInterface {
  listProviders: () => Promise<ProviderList>;
  startProvider: (key: string) => Promise<ProviderMeta>;
}

type InjectedWalletData = {
  accounts: InjectedAccounts;
  metadata?: InjectedMetadata;
  provider?: InjectedProvider;
  signer: InjectedSigner;
};

export type SubstrateInjectedExtension = Record<
  string,
  {
    connect?: (origin: string) => Promise<InjectedExtensionInfo & InjectedWalletData>;
    enable?: (origin: string) => Promise<InjectedWalletData>;
    version?: string;
  }
>;
