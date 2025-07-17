import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import {
  type AssetValue,
  Chain,
  ChainId,
  DerivationPath,
  type DerivationPathArray,
  type GenericTransferParams,
  SKConfig,
  SwapKitError,
  derivationPathToString,
} from "@swapkit/helpers";
import type { ThorchainDepositParams } from "@swapkit/toolboxes/cosmos";

import { bip32ToAddressNList } from "../coins";

type SignTransactionParams = {
  assetValue: AssetValue;
  recipient?: string;
  sender: string;
  memo: string | undefined;
};

export const mayachainWalletMethods = async ({
  sdk,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  derivationPath?: DerivationPathArray;
}) => {
  const { createStargateClient, getCosmosToolbox } = await import("@swapkit/toolboxes/cosmos");

  const toolbox = await getCosmosToolbox(Chain.Maya);
  const derivationPathString = derivationPath
    ? derivationPathToString(derivationPath)
    : `${DerivationPath.MAYA}/0`;

  const { address: fromAddress } = (await sdk.address.mayachainGetAddress({
    address_n: bip32ToAddressNList(derivationPathString),
  })) as { address: string };

  const signTransaction = async ({
    assetValue,
    recipient,
    sender,
    memo,
  }: SignTransactionParams) => {
    const importedAmino = await import("@cosmjs/amino");
    const makeSignDoc = importedAmino.makeSignDoc ?? importedAmino.default?.makeSignDoc;
    const { getDenomWithChain } = await import("@swapkit/toolboxes/cosmos");

    const account = await toolbox.getAccount(sender);
    if (!account) throw new SwapKitError("wallet_keepkey_account_not_found");
    const { accountNumber, sequence = 0 } = account;
    const amount = assetValue.getBaseValue("string");

    const isTransfer = recipient && recipient !== "";

    // TODO check if we can move to toolbox created msg
    const msg = isTransfer
      ? {
          type: "mayachain/MsgSend",
          value: {
            amount: [{ amount, denom: assetValue.symbol.toLowerCase() }],
            from_address: sender,
            to_address: recipient,
          },
        }
      : {
          type: "mayachain/MsgDeposit",
          value: {
            coins: [{ amount, asset: getDenomWithChain(assetValue) }],
            memo,
            signer: sender,
          },
        };

    const signDoc = makeSignDoc(
      [msg],
      { gas: "500000000", amount: [] },
      ChainId.Maya,
      memo,
      accountNumber?.toString(),
      sequence,
    );

    const sdkMethod = isTransfer
      ? sdk.mayachain.mayachainSignAminoTransfer
      : sdk.mayachain.mayachainSignAminoDeposit;

    // @ts-expect-error TC
    const signedTx = await sdkMethod({ signDoc, signerAddress: sender });
    const decodedBytes = atob(signedTx.serialized);
    return new Uint8Array(decodedBytes.length).map((_, i) => decodedBytes.charCodeAt(i));
  };

  const transfer = async ({ assetValue, recipient, memo }: GenericTransferParams) => {
    const stargateClient = await createStargateClient(SKConfig.get("rpcUrls")[Chain.Maya]);
    const signedTransaction = await signTransaction({
      assetValue,
      recipient,
      memo,
      sender: fromAddress,
    });
    const { transactionHash } = await stargateClient.broadcastTx(signedTransaction);

    return transactionHash;
  };

  const deposit = async ({ assetValue, memo }: ThorchainDepositParams) => {
    const stargateClient = await createStargateClient(SKConfig.get("rpcUrls")[Chain.Maya]);
    const signedTransaction = await signTransaction({
      assetValue,
      memo,
      sender: fromAddress,
    });
    const { transactionHash } = await stargateClient.broadcastTx(signedTransaction);

    return transactionHash;
  };

  return { ...toolbox, transfer, deposit, address: fromAddress };
};
