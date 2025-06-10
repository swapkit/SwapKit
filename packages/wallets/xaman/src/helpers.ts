import { Chain } from "@swapkit/helpers";
import type { AssetValue } from "@swapkit/helpers";
import type { Xumm } from "xumm";
import { sendXamanTransaction, waitForXamanTransactionResult } from "./walletMethods.js";

interface GetWalletForChainParams {
  apis: Record<string, any>;
  chain: Chain;
  address: string;
  rpcUrl?: string;
  xumm: Xumm;
}

export async function getWalletForChain({ xumm, chain, address, rpcUrl }: GetWalletForChainParams) {
  switch (chain) {
    case Chain.Ripple: {
      const { XRPToolbox } = await import("@swapkit/toolbox-ripple");

      // const api = apis?.[chain]; // Unused for now
      const toolbox = await XRPToolbox({ rpcUrl });

      // Override transfer method to use Xaman transaction flow
      const transfer = async (params: {
        assetValue: AssetValue;
        recipient: string;
        memo?: string;
      }) => {
        const { recipient, assetValue, memo } = params;

        // Create payment via Xaman
        const paymentResult = await sendXamanTransaction(xumm, {
          from: address,
          destination: recipient,
          amount: assetValue.getValue("string"),
          memo: memo,
        });

        // Wait for transaction completion
        const result = await waitForXamanTransactionResult(xumm, paymentResult.payloadId);

        if (!result.success) {
          throw new Error(result.reason || "Transaction failed");
        }

        return result.transactionId || "";
      };

      return {
        ...toolbox,
        address,
        getAddress: () => address,
        transfer,
        // Expose Xaman-specific methods
        createPaymentPayload: sendXamanTransaction,
        waitForPaymentResult: waitForXamanTransactionResult,
      };
    }

    default:
      throw new Error(`Chain ${chain} is not supported by Xaman wallet`);
  }
}
