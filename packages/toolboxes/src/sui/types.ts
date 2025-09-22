import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import type { GenericCreateTransactionParams, GenericTransferParams } from "@swapkit/helpers";
import type { getSuiToolbox } from "./toolbox";

export type SuiWallet = Awaited<ReturnType<typeof getSuiToolbox>>;

export type SuiCreateTransactionParams = Omit<GenericCreateTransactionParams, "feeRate"> & { gasBudget?: number };

export type SuiTransferParams = Omit<GenericTransferParams, "feeRate"> & { gasBudget?: number };

export type SuiToolboxParams = { provider?: string; phrase?: string; signer?: Ed25519Keypair };
