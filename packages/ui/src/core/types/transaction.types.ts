export interface TransactionState {
  status: TransactionStatus;
  hash?: string;
  error?: TransactionError;
  confirmations?: number;
  requiredConfirmations?: number;
}

export enum TransactionStatus {
  IDLE = "idle",
  PENDING = "pending",
  CONFIRMING = "confirming",
  SUCCESS = "success",
  ERROR = "error",
}

export interface TransactionError {
  code: string;
  message: string;
  details?: unknown;
}
