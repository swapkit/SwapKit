import { SwapKitError } from "../modules/swapKitError";
import { Chain } from "../types/chains";

// Backward compatibility
const supportedChains = [...Object.values(Chain), "TERRA"];

export function validateIdentifier(identifier = "") {
  const uppercasedIdentifier = identifier.toUpperCase();

  const [chain] = uppercasedIdentifier.split(".") as [Chain, string];
  if (supportedChains.includes(chain)) return true;

  const [synthChain] = uppercasedIdentifier.split("/") as [Chain, string];
  if (supportedChains.includes(synthChain)) return true;

  throw new SwapKitError({
    errorKey: "helpers_invalid_identifier",
    info: {
      message: `Invalid identifier: ${identifier}. Expected format: <Chain>.<Ticker> or <Chain>.<Ticker>-<ContractAddress>`,
      identifier,
    },
  });
}

export function validateTNS(name: string) {
  if (name.length > 30) return false;

  const regex = /^[a-zA-Z0-9+_-]+$/g;

  return !!name.match(regex);
}
