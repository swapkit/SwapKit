import { parseNearAmount } from "@near-js/utils";

const MINIMUM_NAME_LENGTH = 2;
const MAXIMUM_NAME_LENGTH = 64;

export function validateNearName(name: string): boolean {
  if (name.length < MINIMUM_NAME_LENGTH || name.length > MAXIMUM_NAME_LENGTH) {
    return false;
  }

  // Only lowercase letters, numbers, and hyphens
  // Cannot start or end with hyphen
  // No consecutive hyphens
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

export function calculateNearNameCost(name: string): string {
  // Pricing based on name length
  // These are suggested prices, the actual minimum is ~0.00182 NEAR
  const length = name.length;

  let costInNear: string;
  if (length <= 2) {
    costInNear = "50"; // 50 NEAR for 2-char names
  } else if (length <= 3) {
    costInNear = "20"; // 20 NEAR for 3-char names
  } else if (length <= 4) {
    costInNear = "5"; // 5 NEAR for 4-char names
  } else if (length <= 5) {
    costInNear = "1"; // 1 NEAR for 5-char names
  } else {
    costInNear = "0.1"; // 0.1 NEAR for 6+ characters
  }

  // Convert NEAR to yoctoNEAR
  return parseNearAmount(costInNear) || "0";
}
