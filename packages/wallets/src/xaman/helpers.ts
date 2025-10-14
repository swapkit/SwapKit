import { type AssetValue, Chain, SwapKitError } from "@swapkit/helpers";
import type { Xumm } from "xumm";
import { sendXamanTransaction } from "./walletMethods";

interface GetWalletForChainParams {
  chain: Chain;
  address: string;
  xumm: Xumm;
}

export async function getWalletForChain({ xumm, chain, address }: GetWalletForChainParams) {
  switch (chain) {
    case Chain.Ripple: {
      const { getRippleToolbox } = await import("@swapkit/toolboxes/ripple");

      // const api = apis?.[chain]; // Unused for now
      const toolbox = await getRippleToolbox({});

      // Override transfer method to use Xaman transaction flow
      const transfer = async (params: { assetValue: AssetValue; recipient: string; memo?: string }) => {
        const { recipient, assetValue, memo } = params;

        // Create and subscribe to payment via Xaman
        const paymentResult = await sendXamanTransaction(xumm, {
          amount: assetValue.getValue("string"),
          destination: recipient,
          from: address,
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
        // Expose Xaman-specific methods
        createAndSubscribePayment: sendXamanTransaction,
        disconnect: xumm.logout,
        getAddress: () => address,
        transfer,
      };
    }

    default:
      throw new SwapKitError("wallet_chain_not_supported", { chain, wallet: "Xaman" });
  }
}
