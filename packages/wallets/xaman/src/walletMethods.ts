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

export const sendXamanTransaction = async (xumm: Xumm, params: XamanPaymentParams) => {
  try {
    // Convert XRP to drops (1 XRP = 1,000,000 drops)
    const amountInDrops = (Number.parseFloat(params.amount) * 1000000).toString();

    // Create transaction object
    const transaction = {
      TransactionType: "Payment",
      Destination: params.destination,
      Amount: amountInDrops,
      Account: params.from,
      Memos: params.memo
        ? [
            {
              Memo: {
                MemoType: Buffer.from("text/plain", "utf8").toString("hex"),
                MemoData: Buffer.from(params.memo, "utf8").toString("hex"),
              },
            },
          ]
        : [],
    } as const;

    // Create payload for signing
    const payload = await xumm.payload?.create(transaction);

    if (!payload) {
      throw new SwapKitError("wallet_xaman_transaction_failed");
    }

    return {
      payloadId: payload.uuid || "",
      qrCode: payload.refs?.qr_png || "",
      deepLink: payload.next?.always || "",
      websocketUrl: payload.refs?.websocket_status || "",
    };
  } catch (error) {
    console.error("Xaman payment creation failed:", error);
    throw new SwapKitError("wallet_xaman_transaction_failed");
  }
};

export const waitForXamanTransactionResult = async (xumm: Xumm, payloadId: string) => {
  try {
    const result = await xumm.payload?.subscribe(payloadId);

    if (!result) {
      throw new SwapKitError("wallet_xaman_monitoring_failed");
    }

    if ("signed" in result && result.signed === true) {
      return {
        success: true,
        transactionId: ("txid" in result ? (result.txid as string) : "") || "",
        account: ("account" in result ? (result.account as string) : "") || "",
      };
    }

    return {
      success: false,
      reason: "Transaction was rejected or cancelled",
    };
  } catch (error) {
    console.error("Xaman transaction monitoring failed:", error);
    throw new SwapKitError("wallet_xaman_monitoring_failed");
  }
};
