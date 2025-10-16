import type { Account } from "@near-js/accounts";
import type { NearGasEstimateParams } from "../types/contract";

export const GAS_COSTS = {
  ACCESS_KEY_ADDITION: "5",
  ACCESS_KEY_DELETION: "5",
  ACCOUNT_CREATION: "30",
  CONTRACT_CALL: "150",
  CONTRACT_DEPLOYMENT: "200",
  SIMPLE_TRANSFER: "1",
  STAKE: "10",
  STORAGE_DEPOSIT: "150",
  TOKEN_TRANSFER: "150",
} as const;

export function isSimpleTransfer(params: NearGasEstimateParams): params is { recipient: string; amount: string } {
  return "recipient" in params && "amount" in params && !("contractId" in params);
}

export function isContractCall(
  params: NearGasEstimateParams,
): params is { contractId: string; methodName: string; args?: Record<string, any>; attachedDeposit?: string } {
  return "contractId" in params && "methodName" in params;
}

export function isBatchTransaction(params: NearGasEstimateParams): params is { actions: any[] } {
  return "actions" in params;
}

export function isAccountCreation(
  params: NearGasEstimateParams,
): params is { newAccountId: string; publicKey?: string } {
  return "newAccountId" in params;
}

export function isContractDeployment(params: NearGasEstimateParams): params is { contractCode: Uint8Array } {
  return "contractCode" in params;
}

export function isCustomEstimator(
  params: NearGasEstimateParams,
): params is { customEstimator: (account: Account) => Promise<string> } {
  return "customEstimator" in params;
}

export function estimateBatchGas(actions: any[]) {
  let totalGas = 0;

  for (const action of actions) {
    switch (action.enum) {
      case "transfer":
        totalGas += Number(GAS_COSTS.SIMPLE_TRANSFER);
        break;
      case "functionCall":
        totalGas += Number(GAS_COSTS.CONTRACT_CALL);
        break;
      case "createAccount":
        totalGas += Number(GAS_COSTS.ACCOUNT_CREATION);
        break;
      case "deployContract":
        totalGas += Number(GAS_COSTS.CONTRACT_DEPLOYMENT);
        break;
      case "addKey":
        totalGas += Number(GAS_COSTS.ACCESS_KEY_ADDITION);
        break;
      case "deleteKey":
        totalGas += Number(GAS_COSTS.ACCESS_KEY_DELETION);
        break;
      case "stake":
        totalGas += Number(GAS_COSTS.STAKE);
        break;
      default:
        totalGas += Number(GAS_COSTS.CONTRACT_CALL);
    }
  }

  return totalGas.toString();
}

export function getContractMethodGas(methodName: string) {
  if (methodName === "ft_transfer" || methodName === "ft_transfer_call") {
    return GAS_COSTS.TOKEN_TRANSFER;
  }
  if (methodName === "storage_deposit") {
    return GAS_COSTS.STORAGE_DEPOSIT;
  }
  return GAS_COSTS.CONTRACT_CALL;
}

export function tgasToGas(tgas: string): string {
  return (BigInt(tgas) * BigInt(10 ** 12)).toString();
}

export function gasToTGas(gas: string): string {
  return (BigInt(gas) / BigInt(10 ** 12)).toString();
}
