import { type AssetValue, Chain, ChainId, StagenetChain, getRPCUrl } from "@swapkit/helpers";

import { createStargateClient, getDenomWithChain } from "../util";
import { bech32ToBase64 } from "./addressFormat";

export const DEFAULT_GAS_VALUE = "5000000000";

export const buildDepositTx = async ({
  signer,
  memo = "",
  assetValue,
  isStagenet = false,
}: {
  isStagenet?: boolean;
  signer: string;
  memo?: string;
  assetValue: AssetValue;
}) => {
  const client = await createStargateClient(
    isStagenet ? getRPCUrl(StagenetChain.THORChain) : getRPCUrl(Chain.THORChain),
  );
  const accountOnChain = await client.getAccount(signer);

  if (!accountOnChain) {
    throw new Error("Account does not exist");
  }

  const chainId = ChainId.THORChain;

  return {
    memo,
    accountNumber: accountOnChain.accountNumber,
    chainId,
    fee: { amount: [], gas: DEFAULT_GAS_VALUE },
    sequence: accountOnChain.sequence,
    msgs: [
      {
        typeUrl: "/types.MsgDeposit",
        value: {
          coins: [
            {
              amount: assetValue.getBaseValue("string"),
              asset: getDenomWithChain(assetValue),
            },
          ],
          signer: bech32ToBase64(signer),
          memo,
        },
      },
    ],
  };
};
