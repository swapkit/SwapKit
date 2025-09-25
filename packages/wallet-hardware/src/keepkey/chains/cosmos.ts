import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import type { GenericTransferParams } from "@swapkit/helpers";
import {
  Chain,
  ChainId,
  DerivationPath,
  type DerivationPathArray,
  derivationPathToString,
  getRPCUrl,
} from "@swapkit/helpers";

import { bip32ToAddressNList } from "../coins";

export async function cosmosWalletMethods({
  sdk,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  derivationPath?: DerivationPathArray;
}): Promise<any> {
  const { DEFAULT_COSMOS_FEE_MAINNET, getCosmosToolbox, getFeeRateFromSwapKit, createStargateClient } = await import(
    "@swapkit/toolboxes/cosmos"
  );
  const derivationPathString = derivationPath ? derivationPathToString(derivationPath) : `${DerivationPath.GAIA}/0`;

  const { address: fromAddress } = (await sdk.address.cosmosGetAddress({
    address_n: bip32ToAddressNList(derivationPathString),
  })) as { address: string };

  const toolbox = await getCosmosToolbox(Chain.Cosmos);

  if (DEFAULT_COSMOS_FEE_MAINNET.amount[0]) {
    DEFAULT_COSMOS_FEE_MAINNET.amount[0].amount = String(await getFeeRateFromSwapKit(ChainId.GAIA, 500));
  }

  // TODO support other cosmos assets
  const transfer = async ({ assetValue, recipient, memo }: GenericTransferParams) => {
    const amount = assetValue.getBaseValue("string");
    const accountInfo = await toolbox.getAccount(fromAddress);

    const keepKeySignedTx = await sdk.cosmos.cosmosSignAmino({
      signDoc: {
        account_number: accountInfo?.accountNumber.toString() ?? "",
        chain_id: ChainId.GAIA,
        fee: DEFAULT_COSMOS_FEE_MAINNET,
        memo: memo || "",
        msgs: [
          {
            type: "cosmos-sdk/MsgSend",
            value: { amount: [{ amount, denom: "uatom" }], from_address: fromAddress, to_address: recipient },
          },
        ],
        sequence: accountInfo?.sequence.toString() ?? "",
      },
      signerAddress: fromAddress,
    });

    const decodedBytes = atob(keepKeySignedTx.serialized);
    const uint8Array = new Uint8Array(decodedBytes.length).map((_, i) => decodedBytes.charCodeAt(i));

    const rpcUrl = await getRPCUrl(Chain.Cosmos);
    const client = await createStargateClient(rpcUrl);
    const response = await client.broadcastTx(uint8Array);

    return response.transactionHash;
  };

  return { ...toolbox, address: fromAddress, transfer };
}
