import type { Chain } from "../types/chains";
import type { WalletOption } from "../types/wallet";
import { SwapKitError } from "./swapKitError";

export function filterSupportedChains<T extends Chain>(
  chains: Chain[],
  supportedChains: readonly T[],
  walletOption: WalletOption,
) {
  const supported = chains.filter((chain): chain is T => supportedChains.includes(chain as T));

  if (supported.length === 0) {
    throw new SwapKitError("wallet_chain_not_supported", {
      wallet: walletOption,
      chain: chains.join(", "),
    });
  }

  const unsupported = chains.filter((chain) => !supportedChains.includes(chain as T));

  if (unsupported.length > 0) {
    console.warn(
      `${walletOption} wallet does not support the following chains: ${unsupported.join(
        ", ",
      )}. These chains will be ignored.`,
    );
  }

  return supported;
}
