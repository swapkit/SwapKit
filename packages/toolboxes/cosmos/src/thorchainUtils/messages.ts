import type { TxBodyEncodeObject } from "@cosmjs/proto-signing";
import { AssetValue, Chain, ChainToChainId } from "@swapkit/helpers";

import {
  createStargateClient,
  getDefaultChainFee,
  getDenomWithChain,
  getMsgSendDenom,
} from "../util";

import { createDefaultAminoTypes, createDefaultRegistry } from "./registry";
import type { ThorcahinDepositTxParams, ThorchainTransferTxParams } from "./types/client-types";

type MsgSend = ReturnType<typeof transferMsgAmino>;
type MsgDeposit = ReturnType<typeof depositMsgAmino>;
type DirectMsgSendForBroadcast = ReturnType<typeof parseAminoMessageForDirectSigning<MsgSend>>;
type DirectMsgDepositForBroadcast = ReturnType<
  typeof parseAminoMessageForDirectSigning<MsgDeposit>
>;

export const THORCHAIN_GAS_VALUE = getDefaultChainFee(Chain.THORChain).gas;
export const MAYA_GAS_VALUE = getDefaultChainFee(Chain.Maya).gas;

export const transferMsgAmino = ({
  from,
  recipient,
  assetValue,
  chain,
}: {
  from: string;
  recipient?: string;
  assetValue: AssetValue;
  chain: Chain.THORChain | Chain.Maya;
}) => ({
  type: `${chain === Chain.Maya ? "mayachain" : "thorchain"}/MsgSend` as const,
  value: {
    from_address: from,
    to_address: recipient,
    amount: [
      {
        amount: assetValue.getBaseValue("string"),
        denom: getMsgSendDenom(assetValue.symbol, true),
      },
    ],
  },
});

export const depositMsgAmino = ({
  from,
  assetValue,
  memo = "",
  chain,
}: {
  from: string;
  assetValue: AssetValue;
  memo?: string;
  chain: Chain.THORChain | Chain.Maya;
}) => {
  return {
    type: `${chain === Chain.Maya ? "mayachain" : "thorchain"}/MsgDeposit` as const,
    value: {
      coins: [
        {
          amount: assetValue.getBaseValue("string"),
          asset: getDenomWithChain(assetValue),
        },
      ],
      signer: from,
      memo,
    },
  };
};

export const buildAminoMsg = ({
  from,
  recipient,
  assetValue,
  memo,
  chain,
}: {
  from: string;
  recipient?: string;
  assetValue: AssetValue;
  memo?: string;
  chain: Chain.THORChain | Chain.Maya;
}) => {
  const isDeposit = !recipient;
  const msg = isDeposit
    ? depositMsgAmino({ from, assetValue, memo, chain })
    : transferMsgAmino({ from, recipient, assetValue, chain });

  return msg;
};

export const convertToSignable = (
  msg: DirectMsgDepositForBroadcast | DirectMsgSendForBroadcast | MsgSend | MsgDeposit,
  chain: Chain.THORChain | Chain.Maya,
) => {
  const aminoTypes = createDefaultAminoTypes(chain);

  return aminoTypes.fromAmino(msg);
};

const getAccount = async ({
  rpcUrl,
  from,
}: {
  from: string;
  rpcUrl: string;
}) => {
  const client = await createStargateClient(rpcUrl);

  const account = await client.getAccount(from);

  if (!account) {
    throw new Error("Account does not exist");
  }

  return account;
};

export const buildTransferTx =
  (rpcUrl: string) =>
  async ({
    from,
    recipient,
    assetValue,
    memo = "",
    chain,
    asSignable = true,
    asAminoMessage = false,
  }: ThorchainTransferTxParams) => {
    const account = await getAccount({ rpcUrl, from });

    const transferMsg = transferMsgAmino({
      from,
      recipient,
      assetValue,
      chain,
    });

    const msg = asSignable
      ? convertToSignable(
          asAminoMessage ? transferMsg : parseAminoMessageForDirectSigning(transferMsg),
          chain,
        )
      : transferMsg;

    const transaction = {
      chainId: ChainToChainId[chain],
      accountNumber: account.accountNumber,
      sequence: account.sequence,
      msgs: [msg],
      fee: getDefaultChainFee(assetValue.chain as Chain.THORChain | Chain.Maya),
      memo,
    };

    return transaction;
  };

export const buildDepositTx =
  (rpcUrl: string) =>
  async ({
    from,
    assetValue,
    memo = "",
    chain,
    asSignable = true,
    asAminoMessage = false,
  }: ThorcahinDepositTxParams) => {
    const account = await getAccount({ rpcUrl, from });

    const depositMsg = depositMsgAmino({ from, assetValue, memo, chain });

    const msg = asSignable
      ? convertToSignable(
          asAminoMessage ? depositMsg : parseAminoMessageForDirectSigning<MsgDeposit>(depositMsg),
          chain,
        )
      : depositMsg;

    const transaction = {
      chainId: ChainToChainId[chain],
      accountNumber: account.accountNumber,
      sequence: account.sequence,
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
            ticker: symbol,
            synth: assetValue.isSynthetic,
          },
        };
      }),
    },
  };
}

export const buildEncodedTxBody = ({
  chain,
  memo,
  msgs,
}: {
  msgs: DirectMsgSendForBroadcast[] | DirectMsgDepositForBroadcast[];
  memo: string;
  chain: Chain.THORChain | Chain.Maya;
}) => {
  const registry = createDefaultRegistry();
  const aminoTypes = createDefaultAminoTypes(chain);

  const signedTxBody: TxBodyEncodeObject = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: { memo, messages: msgs.map((msg) => aminoTypes.fromAmino(msg)) },
  };

  return registry.encode(signedTxBody);
};
