import type {
  KeepKeySdk,
  TypesThorchainSignDocDeposit,
  TypesThorchainSignDocTransfer,
} from "@keepkey/keepkey-sdk";
import {
  type AssetValue,
  Chain,
  ChainId,
  DerivationPath,
  type DerivationPathArray,
  derivationPathToString,
  getRPCUrl,
} from "@swapkit/helpers";
import type { DepositParam, ThorchainToolboxType, TransferParams } from "@swapkit/toolbox-cosmos";

import { bip32ToAddressNList } from "../helpers/coins.js";

type SignTransactionParams = {
  assetValue: AssetValue;
  recipient?: string;
  from: string;
  memo: string | undefined;
};

export const thorchainWalletMethods = async ({
  sdk,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  derivationPath?: DerivationPathArray;
}): Promise<ThorchainToolboxType & { address: string }> => {
  const { makeSignDoc } = await import("@cosmjs/amino");
  const { buildAminoMsg, getDefaultChainFee, createStargateClient, ThorchainToolbox } =
    await import("@swapkit/toolbox-cosmos");

  const toolbox = ThorchainToolbox({ stagenet: false });
  const derivationPathString = derivationPath
    ? derivationPathToString(derivationPath)
    : `${DerivationPath.THOR}/0`;

  const { address: fromAddress } = (await sdk.address.thorchainGetAddress({
    address_n: bip32ToAddressNList(derivationPathString),
  })) as { address: string };

  const signTransaction = async ({ assetValue, recipient, from, memo }: SignTransactionParams) => {
    const account = await toolbox.getAccount(from);
    if (!account) throw new Error("Account not found");
    const { accountNumber, sequence = 0 } = account;

    const isTransfer = recipient && recipient !== "";

    const msg = buildAminoMsg({ chain: Chain.THORChain, from, recipient, assetValue, memo });

    const chainId = ChainId.THORChain;

    const signDoc = makeSignDoc(
      [msg],
      getDefaultChainFee(Chain.THORChain),
      chainId,
      memo,
      accountNumber?.toString(),
      sequence,
    );

    const signedTx = isTransfer
      ? await sdk.thorchain.thorchainSignAminoTransfer({
          signDoc: signDoc as TypesThorchainSignDocTransfer,
          signerAddress: from,
        })
      : await sdk.thorchain.thorchainSignAminoDeposit({
          signDoc: signDoc as TypesThorchainSignDocDeposit,
          signerAddress: from,
        });
    const decodedBytes = atob(signedTx.serialized);
    return new Uint8Array(decodedBytes.length).map((_, i) => decodedBytes.charCodeAt(i));
  };

  const transfer = async ({ assetValue, recipient, memo }: TransferParams) => {
    const stargateClient = await createStargateClient(getRPCUrl(Chain.THORChain));
    const signedTransaction = await signTransaction({
      assetValue,
      recipient,
      memo,
      from: fromAddress,
    });
    const { transactionHash } = await stargateClient.broadcastTx(signedTransaction);

    return transactionHash;
  };

  const deposit = async ({ assetValue, memo }: DepositParam) => {
    const stargateClient = await createStargateClient(getRPCUrl(Chain.THORChain));
    const signedTransaction = await signTransaction({
      assetValue,
      memo,
      from: fromAddress,
    });
    const { transactionHash } = await stargateClient.broadcastTx(signedTransaction);

    return transactionHash;
  };

  // const signMessage = async (message: string) => {
  //   const stargateClient = await createStargateClient(RPCUrl.THORChain);
  //   // return signedTx;
  // };

  return { ...toolbox, transfer, deposit, address: fromAddress };
};
