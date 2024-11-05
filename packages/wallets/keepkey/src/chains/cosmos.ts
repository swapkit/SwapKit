import type { KeepKeySdk } from "@keepkey/keepkey-sdk";
import {
  Chain,
  ChainId,
  DerivationPath,
  type DerivationPathArray,
  derivationPathToString,
  getRPCUrl,
} from "@swapkit/helpers";
import type { BaseCosmosToolboxType, TransferParams } from "@swapkit/toolbox-cosmos";

import { bip32ToAddressNList } from "../helpers/coins";

export const cosmosWalletMethods = async ({
  sdk,
  api,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  api: string;
  derivationPath?: DerivationPathArray;
}): Promise<BaseCosmosToolboxType & { address: string }> => {
  const { DEFAULT_COSMOS_FEE_MAINNET, GaiaToolbox, createStargateClient } = await import(
    "@swapkit/toolbox-cosmos"
  );

  try {
    const derivationPathString = derivationPath
      ? derivationPathToString(derivationPath)
      : `${DerivationPath.GAIA}/0`;

    const { address: fromAddress } = (await sdk.address.cosmosGetAddress({
      address_n: bip32ToAddressNList(derivationPathString),
    })) as { address: string };

    const toolbox = GaiaToolbox({ server: api });

    if (DEFAULT_COSMOS_FEE_MAINNET.amount[0]) {
      DEFAULT_COSMOS_FEE_MAINNET.amount[0].amount = String(
        await toolbox?.getFeeRateFromThorswap?.(ChainId.Cosmos, 500),
      );
    }

    // TODO support other cosmos assets
    const transfer = async ({ assetValue, recipient, memo }: TransferParams) => {
      const amount = assetValue.getBaseValue("string");
      const accountInfo = await toolbox.getAccount(fromAddress);

      const keepKeySignedTx = await sdk.cosmos.cosmosSignAmino({
        signerAddress: fromAddress,
        signDoc: {
          fee: DEFAULT_COSMOS_FEE_MAINNET,
          memo: memo || "",
          sequence: accountInfo?.sequence.toString() ?? "",
          chain_id: ChainId.Cosmos,
          account_number: accountInfo?.accountNumber.toString() ?? "",
          msgs: [
            {
              value: {
                amount: [{ denom: "uatom", amount }],
                to_address: recipient,
                from_address: fromAddress,
              },
              type: "cosmos-sdk/MsgSend",
            },
          ],
        },
      });

      const decodedBytes = atob(keepKeySignedTx.serialized);
      const uint8Array = new Uint8Array(decodedBytes.length).map((_, i) =>
        decodedBytes.charCodeAt(i),
      );

      const client = await createStargateClient(getRPCUrl(Chain.Cosmos));
      const response = await client.broadcastTx(uint8Array);

      return response.transactionHash;
    };

    return { ...toolbox, transfer, address: fromAddress };
  } catch (e) {
    console.error(e);
    throw e;
  }
};
