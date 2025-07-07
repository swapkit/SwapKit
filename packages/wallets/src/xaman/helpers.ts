import { type AssetValue, Chain, SwapKitError } from "@swapkit/helpers";
import type { Xumm } from "xumm";
import { sendXamanTransaction } from "./walletMethods.js";

interface GetWalletForChainParams {
  chain: Chain;
  address: string;
  rpcUrl?: string;
  xumm: Xumm;
}

export async function getWalletForChain({ xumm, chain, address, rpcUrl }: GetWalletForChainParams) {
  switch (chain) {
    case Chain.Ripple: {
      const { getRippleToolbox } = await import("@swapkit/toolboxes/ripple");

      // const api = apis?.[chain]; // Unused for now
      const toolbox = await getRippleToolbox({ rpcUrl });

      // Override transfer method to use Xaman transaction flow
      const transfer = async (params: {
        assetValue: AssetValue;
        recipient: string;
        memo?: string;
      }) => {
        const { recipient, assetValue, memo } = params;

        // Create and subscribe to payment via Xaman
        const paymentResult = await sendXamanTransaction(xumm, {
          from: address,
          destination: recipient,
          amount: assetValue.getValue("string"),
          memo: memo,
        });

        // If not successful or no transaction ID, throw error
        if (!(paymentResult.result.success && paymentResult.result.transactionId)) {
          throw new SwapKitError("wallet_xaman_transaction_failed");
        }

        // Return the transaction ID string
        return paymentResult.result.transactionId;
      };

      return {
        ...toolbox,
        address,
        getAddress: () => address,
        transfer,
        // Expose Xaman-specific methods
        createAndSubscribePayment: sendXamanTransaction,
        disconnect: xumm.logout,
      };
    }

    default:
      throw new SwapKitError("wallet_chain_not_supported", { wallet: "Xaman", chain });
  }
}
