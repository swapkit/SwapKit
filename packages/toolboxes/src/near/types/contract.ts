import type { Account } from "near-api-js";

// Custom interface for contract metadata (not in SDK)
export interface NearContractInterface {
  contractId: string;
  viewMethods: string[];
  changeMethods: string[];
  metadata?: {
    version: string;
    standards: string[]; // e.g., ["nep141", "nep171"]
  };
}

// Enhanced call parameters
export interface NearCallParams {
  contractId: string;
  methodName: string;
  args?: Record<string, any>;
  gas?: string | any; // BN type
  attachedDeposit?: string | any; // BN type
  isView?: boolean;
}

// Gas estimation using discriminated unions for type inference
export type NearGasEstimateParams =
  | {
      recipient: string;
      amount: string;
    }
  | {
      contractId: string;
      methodName: string;
      args?: Record<string, any>;
      attachedDeposit?: string;
    }
  | {
      actions: any[]; // Action type from near-api-js
    }
  | {
      newAccountId: string;
      publicKey?: string;
    }
  | {
      contractCode: Uint8Array;
    }
  | {
      customEstimator: (account: Account) => Promise<string>;
    };
