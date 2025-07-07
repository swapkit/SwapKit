import { SwapKitError } from "@swapkit/helpers";
import type { Xumm } from "xumm";
import type { XamanPaymentParams } from "./types.js";

export const connectXamanWallet = async (xumm: Xumm) => {
  if (!xumm) {
    throw new SwapKitError("wallet_xaman_not_configured");
  }

  try {
    const user = await xumm.user;
    const account = await user?.account;

    if (account) {
      return account;
    }

    throw new SwapKitError("wallet_xaman_auth_failed");
  } catch (error) {
    console.error("Xaman wallet connection failed:", error);
    throw new SwapKitError("wallet_xaman_connection_failed");
  }
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: might need refactoring later
export const sendXamanTransaction = async (xumm: Xumm, params: XamanPaymentParams) => {
  try {
    // Validate required parameters
    if (!(params.destination && params.amount && params.from)) {
      throw new SwapKitError("wallet_xaman_connection_failed");
    }

    // Convert XRP to drops (1 XRP = 1,000,000 drops)
    const amountInDrops = (Number.parseFloat(params.amount) * 1000000).toString();

    // Create transaction object
    const transaction = {
      TransactionType: "Payment" as const,
      Destination: params.destination,
      Amount: amountInDrops,
      Account: params.from,
      ...(params.destinationTag !== undefined && {
        DestinationTag: params.destinationTag,
      }),
      ...(params.memo && {
        Memos: [
          {
            Memo: {
              MemoData: Buffer.from(params.memo, "utf8").toString("hex").toUpperCase(),
            },
          },
        ],
      }),
    };

    // Create and subscribe to payload following the official example
    const subscription = await xumm.payload?.createAndSubscribe(transaction, (event) => {
      if ("signed" in event.data) {
        // Return event.data to close subscription and resolve promise
        return event.data; // { signed: true|false, payload_uuidv4: '...' }
      }
      return undefined;
    });

    if (!subscription) {
      throw new SwapKitError("wallet_xaman_transaction_failed");
    }

    const { created } = subscription;

    // Handle payload presentation based on runtime environment
    if (xumm.runtime?.xapp) {
      xumm.xapp?.openSignRequest(created);
    } else if (typeof window !== "undefined") {
      const url =
        created.pushed && created.next?.no_push_msg_received
          ? created.next.no_push_msg_received
          : created.next?.always;
      if (url) window.open(url);
    }

    // Wait until the user signed/rejected
    const resolved = await subscription.resolved;

    if (!resolved || typeof resolved !== "object" || !("signed" in resolved) || !resolved.signed) {
      throw new SwapKitError("wallet_xaman_transaction_failed");
    }

    // Fetch the full payload result using the UUID from resolved data
    const payloadDetails = await xumm.payload?.get((resolved as any).payload_uuidv4);

    if (!payloadDetails) {
      throw new SwapKitError("wallet_xaman_monitoring_failed");
    }

    // Extract transaction ID from response
    const transactionId = payloadDetails.response?.txid || "";
    const account = payloadDetails.response?.account || "";

    if (!transactionId) {
      throw new SwapKitError("wallet_xaman_transaction_failed");
    }

    // Return comprehensive result
    return {
      // Initial payload info for QR codes, deep links, etc.
      payloadId: created.uuid || "",
      qrCode: created.refs?.qr_png || "",
      deepLink: created.next?.always || "",
      websocketUrl: created.refs?.websocket_status || "",
      // Final transaction result - SUCCESS with tx hash
      result: {
        success: true,
        transactionId,
        account,
        reason: undefined,
      },
    };
  } catch (error) {
    console.error("Xaman payment creation and subscription failed:", error);
    if (error instanceof SwapKitError) {
      throw error;
    }
    throw new SwapKitError("wallet_xaman_transaction_failed");
  }
};
