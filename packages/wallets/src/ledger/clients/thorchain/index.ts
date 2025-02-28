import { base64 } from "@scure/base";
import { type DerivationPathArray, NetworkDerivationPath } from "@swapkit/helpers";

import { CosmosLedgerInterface } from "../../interfaces/CosmosLedgerInterface";
import type { GetAddressAndPubKeyResponse } from "../../types";
import { getSignature } from "./utils";

export class THORChainLedger extends CosmosLedgerInterface {
  private pubKey: string | null = null;

  derivationPath: DerivationPathArray;

  constructor(derivationPath: DerivationPathArray = NetworkDerivationPath.THOR) {
    super();
    this.chain = "thor";
    this.derivationPath = derivationPath;
  }

  get pubkey() {
    return this.pubKey;
  }

  connect = async () => {
    await this.checkOrCreateTransportAndLedger();
    const { compressed_pk, bech32_address }: GetAddressAndPubKeyResponse =
      await this.getAddressAndPubKey();

    this.pubKey = base64.encode(compressed_pk);

    return bech32_address;
  };

  getAddressAndPubKey = async () => {
    await this.checkOrCreateTransportAndLedger(true);

    const response: GetAddressAndPubKeyResponse = await this.ledgerApp.getAddressAndPubKey(
      this.derivationPath,
      this.chain,
    );

    this.validateResponse(response.return_code, response.error_message);

    return response;
  };

  showAddressAndPubKey = async () => {
    await this.checkOrCreateTransportAndLedger(true);

    const response: GetAddressAndPubKeyResponse = await this.ledgerApp.showAddressAndPubKey(
      this.derivationPath,
      this.chain,
    );

    this.validateResponse(response.return_code, response.error_message);

    return response;
  };

  signTransaction = async (rawTx: string, sequence = "0") => {
    await this.checkOrCreateTransportAndLedger(true);

    const { return_code, error_message, signature } = await this.ledgerApp.sign(
      this.derivationPath,
      rawTx,
    );

    if (!this.pubKey) throw new Error("Public Key not found");

    this.validateResponse(return_code, error_message);

    return [
      {
        pub_key: { type: "tendermint/PubKeySecp256k1", value: this.pubKey },
        sequence,
        signature: getSignature(signature),
      },
    ];
  };

  sign = async (message: string) => {
    await this.checkOrCreateTransportAndLedger(true);

    const { return_code, error_message, signature } = await this.ledgerApp.sign(
      this.derivationPath,
      message,
    );

    if (!this.pubKey) throw new Error("Public Key not found");

    this.validateResponse(return_code, error_message);

    return getSignature(signature);
  };

  signAmino = async (signerAddress: string, signDoc: any): Promise<any> => {
    await this.checkOrCreateTransportAndLedger(true);

    const accounts = await this.getAccounts();
    const accountIndex = accounts.findIndex((account) => account.address === signerAddress);

    if (accountIndex === -1) {
      throw new Error(`Address ${signerAddress} not found in wallet`);
    }

    const { encodeSecp256k1Signature, serializeSignDoc } = await import("@cosmjs/amino");
    const { Secp256k1Signature } = await import("@cosmjs/crypto");

    const message = serializeSignDoc(signDoc);
    const signature = await this.ledgerApp.sign(this.derivationPath, message);

    this.validateResponse(signature.return_code, signature.error_message);

    const secpSignature = Secp256k1Signature.fromDer(signature.signature).toFixedLength();

    return {
      signed: signDoc,
      signature: encodeSecp256k1Signature(accounts[0].pubkey, secpSignature),
    };
  };

  getAccounts = async () => {
    await this.checkOrCreateTransportAndLedger(true);

    const addressAndPubKey = await this.getAddressAndPubKey();
    return [
      {
        address: addressAndPubKey.bech32_address,
        algo: "secp256k1",
        pubkey: Buffer.from(addressAndPubKey.compressed_pk, "hex"),
      },
    ] as any[];
  };
}
