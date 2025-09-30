import type { KeepKeySdk, TypesThorchainSignDocDeposit, TypesThorchainSignDocTransfer } from "@keepkey/keepkey-sdk";
import {
  type AssetValue,
  Chain,
  DerivationPath,
  type DerivationPathArray,
  derivationPathToString,
  type GenericTransferParams,
  getRPCUrl,
  SwapKitError,
  THORConfig,
} from "@swapkit/helpers";
import type { ThorchainDepositParams } from "@swapkit/toolboxes/cosmos";

import { bip32ToAddressNList } from "../coins";

type SignTransactionParams = { assetValue: AssetValue; recipient?: string; sender: string; memo: string | undefined };

export async function thorchainWalletMethods({
  sdk,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  derivationPath?: DerivationPathArray;
}): Promise<any> {
  const importedAmino = await import("@cosmjs/amino");
  const makeSignDoc = importedAmino.makeSignDoc ?? importedAmino.default?.makeSignDoc;
  const { buildAminoMsg, getDefaultChainFee, createStargateClient, getCosmosToolbox } = await import(
    "@swapkit/toolboxes/cosmos"
  );

  const toolbox = await getCosmosToolbox(Chain.THORChain);
  const derivationPathString = derivationPath ? derivationPathToString(derivationPath) : `${DerivationPath.THOR}/0`;

  const { address: fromAddress } = (await sdk.address.thorchainGetAddress({
    address_n: bip32ToAddressNList(derivationPathString),
  })) as { address: string };

  const signTransaction = async ({ assetValue, recipient, sender, memo }: SignTransactionParams) => {
    const account = await toolbox.getAccount(sender);
    if (!account) throw new SwapKitError("wallet_keepkey_account_not_found");
    const { accountNumber, sequence = 0 } = account;

    const isTransfer = recipient && recipient !== "";
    const msg = buildAminoMsg({ assetValue, memo, recipient, sender });

    const signDoc = makeSignDoc(
      [msg],
      getDefaultChainFee(Chain.THORChain),
      THORConfig.chainId,
      memo,
      accountNumber?.toString(),
      sequence,
    );

    const signedTx = isTransfer
      ? await sdk.thorchain.thorchainSignAminoTransfer({
          signDoc: signDoc as TypesThorchainSignDocTransfer,
          signerAddress: sender,
        })
      : await sdk.thorchain.thorchainSignAminoDeposit({
          signDoc: signDoc as TypesThorchainSignDocDeposit,
          signerAddress: sender,
        });
    const decodedBytes = atob(signedTx.serialized);
    return new Uint8Array(decodedBytes.length).map((_, i) => decodedBytes.charCodeAt(i));
  };

  const transfer = async ({ assetValue, recipient, memo }: GenericTransferParams) => {
    const rpcUrl = await getRPCUrl(Chain.THORChain);
    const stargateClient = await createStargateClient(rpcUrl);
    const signedTransaction = await signTransaction({ assetValue, memo, recipient, sender: fromAddress });
    const { transactionHash } = await stargateClient.broadcastTx(signedTransaction);

    return transactionHash;
  };

  const deposit = async ({ assetValue, memo }: ThorchainDepositParams) => {
    const rpcUrl = await getRPCUrl(Chain.THORChain);
    const stargateClient = await createStargateClient(rpcUrl);
    const signedTransaction = await signTransaction({ assetValue, memo, sender: fromAddress });
    const { transactionHash } = await stargateClient.broadcastTx(signedTransaction);

    return transactionHash;
  };

  // const signMessage = async (message: string) => {
  //   const stargateClient = await createStargateClient(RPCUrl.THORChain);
  //   // return signedTx;
  // };

  return { ...toolbox, address: fromAddress, deposit, transfer };
}
