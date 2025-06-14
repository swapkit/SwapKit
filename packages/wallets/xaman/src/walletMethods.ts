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

export const createAndSubscribeXamanTransaction = async (
  xumm: Xumm,
  params: XamanPaymentParams,
) => {
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

    // Create and subscribe to payload
    const { created, resolved } = (await xumm.payload?.createAndSubscribe(transaction)) || {
      created: null,
      resolved: null,
    };

    if (!created) {
      throw new SwapKitError("wallet_xaman_transaction_failed");
    }

    // Running in web browser - open payload URL
    if (created.pushed && created.next?.no_push_msg_received) {
      // Open the no-push fallback URL
      if (typeof window !== "undefined") {
        window.open(created.next.no_push_msg_received);
      }
    } else if (created.next?.always) {
      // Open the standard payload URL
      if (typeof window !== "undefined") {
        window.open(created.next.always);
      }
    }

    // Wait for resolution
    const resolveData = await resolved;

    // Get transaction details after resolution
    let transactionId = "";
    let account = "";
    let isSuccess = false;
    let isRejected = false;

    if (resolveData) {
      // Get full payload details to extract transaction information
      const payloadDetails = await xumm.payload?.get(created.uuid || "");

      if (payloadDetails?.response) {
        // A successful transaction will have txid and hex populated
        isSuccess = !!(payloadDetails.response.txid && payloadDetails.response.hex);
        // Check if the payload was explicitly rejected (no txid but resolved)
        isRejected = !payloadDetails.response.txid && !!payloadDetails.response.resolved_at;
        transactionId = payloadDetails.response.txid || "";
        account = payloadDetails.response.account || "";
      }
    }

    // Return both creation info and result
    return {
      // Initial payload info for QR codes, deep links, etc.
      payloadId: created.uuid || "",
      qrCode: created.refs?.qr_png || "",
      deepLink: created.next?.always || "",
      websocketUrl: created.refs?.websocket_status || "",
      // Final transaction result
      result: {
        success: isSuccess,
        transactionId,
        account,
        reason: isRejected ? "Transaction was rejected or cancelled by user" : undefined,
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

// Alias for the main function to maintain API compatibility
export const sendXamanTransaction = createAndSubscribeXamanTransaction;
