export interface SwapValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
}

export enum ValidationErrorCode {
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  NO_ROUTE = "NO_ROUTE",
  BELOW_MINIMUM = "BELOW_MINIMUM",
  ABOVE_MAXIMUM = "ABOVE_MAXIMUM",
  INVALID_RECIPIENT = "INVALID_RECIPIENT",
  SAME_TOKEN = "SAME_TOKEN",
  NETWORK_MISMATCH = "NETWORK_MISMATCH",
}
