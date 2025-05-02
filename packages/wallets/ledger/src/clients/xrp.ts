// import Transport from "@ledgerhq/hw-transport-u2f"; // for browser
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport-webusb";
import { NetworkDerivationPath, derivationPathToString } from "@swapkit/helpers";
import { type AsyncXrpSigner, type Transaction, hashes } from "@swapkit/toolbox-ripple";
import { encode } from "ripple-binary-codec";

function establishConnection(): Promise<Xrp> {
  return Transport.create().then((transport) => new Xrp(transport));
}

function fetchAddress(xrp: Xrp) {
  return xrp.getAddress("44'/144'/0'/0/0");
}

export const LedgerXrpSigner = async (): Promise<AsyncXrpSigner> => {
  const connection = await establishConnection();

  const { address } = await fetchAddress(connection);

  async function sign(tx: Transaction) {
    const transactionBlob = encode(tx);

    const signedBlob = await connection.signTransaction(
      derivationPathToString(NetworkDerivationPath.XRP),
      transactionBlob,
    );

    return {
      tx_blob: signedBlob,
      hash: hashes.hashSignedTx(signedBlob),
    };
  }

  return { address, sign };
};
