import { AssetValue, Chain, SwapKitError } from "@swapkit/helpers";
import type { Account } from "near-api-js";
import type { NearGasEstimateParams } from "../types/contract";

// Gas constants (in TGas - 10^12 gas units)
const GAS_COSTS = {
  SIMPLE_TRANSFER: "1", // 1 TGas
  TOKEN_TRANSFER: "100", // 100 TGas
  CONTRACT_CALL: "100", // 100 TGas base
  ACCOUNT_CREATION: "30", // 30 TGas
  CONTRACT_DEPLOYMENT: "200", // 200 TGas
  ACCESS_KEY_ADDITION: "5", // 5 TGas
  ACCESS_KEY_DELETION: "5", // 5 TGas
  STAKE: "10", // 10 TGas
  STORAGE_DEPOSIT: "100", // 100 TGas
} as const;

// Type guards for discriminated union
function isSimpleTransfer(
  params: NearGasEstimateParams,
): params is { recipient: string; amount: string } {
  return "recipient" in params && "amount" in params && !("contractId" in params);
}

function isContractCall(params: NearGasEstimateParams): params is {
  contractId: string;
  methodName: string;
  args?: Record<string, any>;
  attachedDeposit?: string;
} {
  return "contractId" in params && "methodName" in params;
}

function isBatchTransaction(params: NearGasEstimateParams): params is { actions: any[] } {
  return "actions" in params;
}

function isAccountCreation(params: NearGasEstimateParams): params is {
  newAccountId: string;
  publicKey?: string;
} {
  return "newAccountId" in params;
}

function isContractDeployment(
  params: NearGasEstimateParams,
): params is { contractCode: Uint8Array } {
  return "contractCode" in params;
}

function isCustomEstimator(params: NearGasEstimateParams): params is {
  customEstimator: (account: Account) => Promise<string>;
} {
  return "customEstimator" in params;
}

// Helper function to estimate gas for batch actions
function estimateBatchGas(actions: any[]): string {
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

// Helper function to get gas cost for contract methods
function getContractMethodGas(methodName: string): string {
  if (methodName === "ft_transfer" || methodName === "ft_transfer_call") {
    return GAS_COSTS.TOKEN_TRANSFER;
  }
  if (methodName === "storage_deposit") {
    return GAS_COSTS.STORAGE_DEPOSIT;
  }
  return GAS_COSTS.CONTRACT_CALL;
}

export async function estimateGas(
  params: NearGasEstimateParams,
  account?: Account,
): Promise<AssetValue> {
  let gasInTGas: string;

  if (isSimpleTransfer(params)) {
    gasInTGas = GAS_COSTS.SIMPLE_TRANSFER;
  } else if (isContractCall(params)) {
    gasInTGas = getContractMethodGas(params.methodName);
  } else if (isBatchTransaction(params)) {
    gasInTGas = estimateBatchGas(params.actions);
  } else if (isAccountCreation(params)) {
    gasInTGas = GAS_COSTS.ACCOUNT_CREATION;
  } else if (isContractDeployment(params)) {
    gasInTGas = GAS_COSTS.CONTRACT_DEPLOYMENT;
  } else if (isCustomEstimator(params)) {
    if (!account) {
      throw new SwapKitError("toolbox_near_no_account");
    }
    gasInTGas = await params.customEstimator(account);
  } else {
    throw new SwapKitError("toolbox_near_invalid_gas_params");
  }

  // Convert TGas to gas price in NEAR
  const gasPrice = await getGasPrice(account);
  const gasInUnits = BigInt(gasInTGas) * BigInt(10 ** 12); // Convert TGas to gas units
  const costInYoctoNear = gasInUnits * BigInt(gasPrice);

  // Convert yoctoNEAR to NEAR
  const { utils } = await import("near-api-js");
  const costInNear = utils.format.formatNearAmount(costInYoctoNear.toString());

  return AssetValue.from({
    chain: Chain.Near,
    value: Number(costInNear),
  });
}

// Get current gas price from network
async function getGasPrice(account?: Account): Promise<string> {
  if (!account) {
    // Default gas price if no account available
    return "100000000"; // 0.1 Gwei
  }

  try {
    // Get the latest block to fetch current gas price
    const status = await account.connection.provider.status();
    const blockId = status.sync_info.latest_block_hash;

    const result = await account.connection.provider.gasPrice(blockId);
    return result.gas_price || "100000000";
  } catch (_error) {
    // Fallback to default
    return "100000000";
  }
}

// Convert TGas string to gas units
export function tgasToGas(tgas: string): string {
  return (BigInt(tgas) * BigInt(10 ** 12)).toString();
}

// Convert gas units to TGas
export function gasToTGas(gas: string): string {
  return (BigInt(gas) / BigInt(10 ** 12)).toString();
}
