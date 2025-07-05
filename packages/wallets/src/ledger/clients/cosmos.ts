import {
  type DerivationPathArray,
  NetworkDerivationPath,
  SwapKitError,
  derivationPathToString,
} from "@swapkit/helpers";
import { CosmosLedgerInterface } from "../interfaces/CosmosLedgerInterface";

export class CosmosLedger extends CosmosLedgerInterface {
  private pubKey: string | null = null;

  derivationPath: string;

  constructor(derivationPath: DerivationPathArray = NetworkDerivationPath.GAIA) {
    super();
    this.chain = "cosmos";
    this.derivationPath = derivationPathToString(derivationPath);
  }

  connect = async () => {
    await this.checkOrCreateTransportAndLedger(true);
    const { publicKey, address } = await this.getAddressAndPubKey();

    this.pubKey = Buffer.from(publicKey, "hex").toString("base64");

    return address;
  };

  getAddressAndPubKey = async () => {
    await this.checkOrCreateTransportAndLedger(true);

    const response = await this.ledgerApp.getAddress(this.derivationPath, this.chain);

    return response;
  };

  signTransaction = async (rawTx: string, sequence = "0") => {
    await this.checkOrCreateTransportAndLedger(true);

    const { return_code, error_message, signature } = await this.ledgerApp.sign(
      this.derivationPath,
      rawTx,
    );

    if (!this.pubKey) throw new SwapKitError("wallet_ledger_pubkey_not_found");

    this.validateResponse(return_code, error_message);

    return [
      {
        pub_key: { type: "tendermint/PubKeySecp256k1", value: this.pubKey },
        sequence,
        signature,
      },
    ];
  };

  signAmino = async (signerAddress: string, signDoc: any): Promise<any> => {
    await this.checkOrCreateTransportAndLedger(true);

    const accounts = await this.getAccounts();
    const accountIndex = accounts.findIndex((account) => account.address === signerAddress);

    if (accountIndex === -1) {
      throw new SwapKitError("wallet_ledger_address_not_found", { address: signerAddress });
    }

    const importedAmino = await import("@cosmjs/amino");
    const encodeSecp256k1Signature =
      importedAmino.encodeSecp256k1Signature ?? importedAmino.default?.encodeSecp256k1Signature;
    const serializeSignDoc =
      importedAmino.serializeSignDoc ?? importedAmino.default?.serializeSignDoc;
    const importedCrypto = await import("@cosmjs/crypto");
    const Secp256k1Signature =
      importedCrypto.Secp256k1Signature ?? importedCrypto.default?.Secp256k1Signature;

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
        address: addressAndPubKey.address,
        algo: "secp256k1",
        pubkey: Buffer.from(addressAndPubKey.publicKey, "hex"),
      },
    ] as any[];
  };
}
