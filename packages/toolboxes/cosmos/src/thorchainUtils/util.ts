import { type AssetValue, Chain, ChainId, SKConfig, StagenetChain } from "@swapkit/helpers";

import { createStargateClient, getDenomWithChain } from "../util";
import { bech32ToBase64 } from "./addressFormat";

export const DEFAULT_GAS_VALUE = "5000000000";

export const buildDepositTx = async ({
  signer,
  memo = "",
  assetValue,
}: {
  signer: string;
  memo?: string;
  assetValue: AssetValue;
}) => {
  const { isStagenet } = SKConfig.get("envs");
  const client = await createStargateClient(
    SKConfig.get("rpcUrls")[isStagenet ? StagenetChain.THORChain : Chain.THORChain],
  );
  const accountOnChain = await client.getAccount(signer);

  if (!accountOnChain) {
    throw new Error("Account does not exist");
  }

  return {
    memo,
    accountNumber: accountOnChain.accountNumber,
    chainId: ChainId.THORChain,
    fee: { amount: [], gas: DEFAULT_GAS_VALUE },
    sequence: accountOnChain.sequence,
    msgs: [
      {
        typeUrl: "/types.MsgDeposit",
        value: {
          coins: [
            { amount: assetValue.getBaseValue("string"), asset: getDenomWithChain(assetValue) },
          ],
          signer: bech32ToBase64(signer),
          memo,
        },
      },
    ],
  };
};
