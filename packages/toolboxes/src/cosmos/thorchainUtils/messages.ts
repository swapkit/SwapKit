import type { TxBodyEncodeObject } from "@cosmjs/proto-signing";
import { AssetValue, Chain, ChainToChainId } from "@swapkit/helpers";

import {
  createStargateClient,
  getDefaultChainFee,
  getDenomWithChain,
  getMsgSendDenom,
} from "../util";

import { createDefaultAminoTypes, createDefaultRegistry } from "./registry";
import type {
  ThorchainCreateDepositTransactionParams,
  ThorchainCreateTransactionParams,
} from "./types";

type MsgSend = ReturnType<typeof transferMsgAmino>;
type MsgDeposit = ReturnType<typeof depositMsgAmino>;
type DirectMsgSendForBroadcast = ReturnType<typeof parseAminoMessageForDirectSigning<MsgSend>>;
type DirectMsgDepositForBroadcast = ReturnType<
  typeof parseAminoMessageForDirectSigning<MsgDeposit>
>;

export const THORCHAIN_GAS_VALUE = getDefaultChainFee(Chain.THORChain).gas;
export const MAYA_GAS_VALUE = getDefaultChainFee(Chain.Maya).gas;

export const transferMsgAmino = ({
  sender,
  recipient,
  assetValue,
}: {
  sender: string;
  recipient?: string;
  assetValue: AssetValue;
}) => {
  const chain = assetValue.chain as Chain.THORChain | Chain.Maya;
  return {
    type: `${chain === Chain.Maya ? "mayachain" : "thorchain"}/MsgSend` as const,
    value: {
      from_address: sender,
      to_address: recipient,
      amount: [
        {
          amount: assetValue.getBaseValue("string"),
          denom: getMsgSendDenom(assetValue.symbol, true),
        },
      ],
    },
  };
};

export const depositMsgAmino = ({
  sender,
  assetValue,
  memo = "",
}: {
  sender: string;
  assetValue: AssetValue;
  memo?: string;
}) => {
  const chain = assetValue.chain as Chain.THORChain | Chain.Maya;
  return {
    type: `${chain === Chain.Maya ? "mayachain" : "thorchain"}/MsgDeposit` as const,
    value: {
      coins: [
        {
          amount: assetValue.getBaseValue("string"),
          asset: getDenomWithChain(assetValue),
        },
      ],
      signer: sender,
      memo,
    },
  };
};

export const buildAminoMsg = ({
  sender,
  recipient,
  assetValue,
  memo,
}: {
  sender: string;
  recipient?: string;
  assetValue: AssetValue;
  memo?: string;
}) => {
  const isDeposit = !recipient;
  const msg = isDeposit
    ? depositMsgAmino({ sender, assetValue, memo })
    : transferMsgAmino({ sender, recipient, assetValue });

  return msg;
};

export const convertToSignable = async (
  msg: MsgSend | MsgDeposit,
  chain: Chain.THORChain | Chain.Maya,
) => {
  const aminoTypes = await createDefaultAminoTypes(chain);

  return aminoTypes.fromAmino(msg);
};

const getAccount = async ({ rpcUrl, sender }: { sender: string; rpcUrl: string }) => {
  const client = await createStargateClient(rpcUrl);
  const account = await client.getAccount(sender);

  if (!account) {
    throw new Error("Account does not exist");
  }

  return account;
};

export function getCreateTransaction(rpcUrl: string) {
  return function createTransaction(params: ThorchainCreateTransactionParams) {
    const { assetValue, recipient, memo, sender, asSignable, asAminoMessage } = params;

    if (recipient) {
      return buildTransferTx(rpcUrl)({
        sender,
        recipient,
        assetValue,
        memo,
        asSignable,
        asAminoMessage,
      });
    }

    return buildDepositTx(rpcUrl)({
      sender,
      assetValue,
      memo,
      asSignable,
      asAminoMessage,
    });
  };
}

export const buildTransferTx =
  (rpcUrl: string) =>
  async ({
    sender,
    recipient,
    assetValue,
    memo = "",
    asSignable = true,
    asAminoMessage = false,
    sequence,
    accountNumber,
  }: ThorchainCreateTransactionParams) => {
    const account = await getAccount({ rpcUrl, sender });
    const chain = assetValue.chain as Chain.THORChain | Chain.Maya;

    const transferMsg = transferMsgAmino({
      sender,
      recipient,
      assetValue,
    });

    const msg = asSignable
      ? await convertToSignable(
          asAminoMessage ? transferMsg : parseAminoMessageForDirectSigning(transferMsg),
          chain,
        )
      : transferMsg;

    const transaction = {
      chainId: ChainToChainId[chain],
      accountNumber: accountNumber || account.accountNumber,
      sequence: sequence || account.sequence,
      msgs: [msg],
      fee: getDefaultChainFee(assetValue.chain as Chain.THORChain | Chain.Maya),
      memo,
    };

    return transaction;
  };

export const buildDepositTx =
  (rpcUrl: string) =>
  async ({
    sender,
    assetValue,
    memo = "",
    asSignable = true,
    asAminoMessage = false,
    sequence,
    accountNumber,
  }: ThorchainCreateDepositTransactionParams) => {
    const account = await getAccount({ rpcUrl, sender });
    const chain = assetValue.chain as Chain.THORChain | Chain.Maya;

    const depositMsg = depositMsgAmino({ sender, assetValue, memo });

    const msg = asSignable
      ? await convertToSignable(
          asAminoMessage ? depositMsg : parseAminoMessageForDirectSigning<MsgDeposit>(depositMsg),
          chain,
        )
      : depositMsg;

    const transaction = {
      chainId: ChainToChainId[chain],
      accountNumber: accountNumber || account.accountNumber,
      sequence: sequence || account.sequence,
      msgs: [msg],
      fee: getDefaultChainFee(assetValue.chain as Chain.THORChain | Chain.Maya),
      memo,
    };

    return transaction;
  };

export function parseAminoMessageForDirectSigning<T extends MsgDeposit | MsgSend>(msg: T) {
  if (msg.type === "thorchain/MsgSend" || msg.type === "mayachain/MsgSend") return msg as MsgSend;

  return {
    ...msg,
    value: {
      ...msg.value,
      coins: (msg as MsgDeposit).value.coins.map((coin: { asset: string; amount: string }) => {
        const assetValue = AssetValue.from({ asset: coin.asset });

        const symbol = (
          assetValue.isSynthetic ? assetValue.symbol.split("/")?.[1] : assetValue.symbol
        )?.toUpperCase();
        const chain = (
          assetValue.isSynthetic ? assetValue.symbol.split("/")?.[0] : assetValue.chain
        )?.toUpperCase();

        return {
          ...coin,
          asset: {
            chain,
            symbol,
            ticker: assetValue.ticker,
            synth: assetValue.isSynthetic,
          },
        };
      }),
    },
  };
}

export async function buildEncodedTxBody({
  chain,
  memo,
  msgs,
}: {
  msgs: DirectMsgDepositForBroadcast[] | DirectMsgSendForBroadcast[];
  memo: string;
  chain: Chain.THORChain | Chain.Maya;
}) {
  const registry = await createDefaultRegistry();
  const aminoTypes = await createDefaultAminoTypes(chain);

  const signedTxBody: TxBodyEncodeObject = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: { memo, messages: msgs.map((msg) => aminoTypes.fromAmino(msg)) },
  };

  return registry.encode(signedTxBody);
}
