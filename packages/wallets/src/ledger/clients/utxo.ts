import type BitcoinApp from "@ledgerhq/hw-app-btc";
import type { CreateTransactionArg } from "@ledgerhq/hw-app-btc/lib-es/createTransaction";
import {
  type DerivationPathArray,
  SwapKitError,
  derivationPathToString,
  getWalletFormatFor,
} from "@swapkit/helpers";
import type { Psbt, UTXOType } from "@swapkit/toolbox-utxo";

import { getLedgerTransport } from "../helpers/getLedgerTransport";

type Params = {
  psbt: Psbt;
  inputUtxos: UTXOType[];
  btcApp: any;
  derivationPath: string;
};

const signUTXOTransaction = async (
  { psbt, inputUtxos, btcApp, derivationPath }: Params,
  options?: Partial<CreateTransactionArg>,
) => {
  const { Transaction } = await import("@swapkit/toolbox-utxo");

  const inputs = inputUtxos.map((item) => {
    const utxoTx = Transaction.fromHex(item.txHex || "");
    const splitTx = btcApp.splitTransaction(utxoTx.toHex(), utxoTx.hasWitnesses());

    return [
      splitTx,
      item.index,
      undefined as string | null | undefined,
      undefined as number | null | undefined,
    ] as any;
  });

  const newTxHex = psbt.data.globalMap.unsignedTx.toBuffer().toString("hex");

  const splitNewTx = btcApp.splitTransaction(newTxHex, true);
  const outputScriptHex = btcApp.serializeTransactionOutputs(splitNewTx).toString("hex");

  const params: CreateTransactionArg = {
    additionals: ["bech32"],
    associatedKeysets: inputs.map(() => derivationPath),
    inputs,
    outputScriptHex,
    segwit: true,
    useTrustedInputForSegwit: true,
  };

  return btcApp.createPaymentTransaction({ ...params, ...options });
};

const BaseLedgerUTXO = ({
  chain,
  additionalSignParams,
}: {
  chain: "bitcoin-cash" | "bitcoin" | "litecoin" | "dogecoin" | "dash";
  additionalSignParams?: Partial<CreateTransactionArg>;
}) => {
  let btcApp: InstanceType<typeof BitcoinApp>;
  let transport: any = null;

  async function checkBtcAppAndCreateTransportWebUSB(checkBtcApp = true) {
    if (checkBtcApp && !btcApp) {
      new SwapKitError("wallet_ledger_connection_error", {
        message: `Ledger connection failed:\n${JSON.stringify({ checkBtcApp, btcApp })}`,
      });
    }

    transport ||= await getLedgerTransport();
  }

  async function createTransportWebUSB() {
    transport = await getLedgerTransport();
    const { default: BitcoinApp } = await import("@ledgerhq/hw-app-btc");

    btcApp = new BitcoinApp({ transport, currency: chain });
  }

  return (derivationPathArray?: DerivationPathArray | string) => {
    const derivationPath =
      typeof derivationPathArray === "string"
        ? derivationPathArray
        : derivationPathToString(derivationPathArray as DerivationPathArray);

    const format = getWalletFormatFor(derivationPath);

    return {
      connect: async () => {
        await checkBtcAppAndCreateTransportWebUSB(false);
        const { default: BitcoinApp } = await import("@ledgerhq/hw-app-btc");

        btcApp = new BitcoinApp({ transport, currency: chain });
      },
      getExtendedPublicKey: async (path = "84'/0'/0'", xpubVersion = 76067358) => {
        await checkBtcAppAndCreateTransportWebUSB(false);

        return btcApp.getWalletXpub({ path, xpubVersion });
      },
      signTransaction: async (psbt: Psbt, inputUtxos: UTXOType[]) => {
        await createTransportWebUSB();

        return signUTXOTransaction(
          { psbt, derivationPath, btcApp, inputUtxos },
          additionalSignParams,
        );
      },
      getAddress: async () => {
        const { toCashAddress } = await import("@swapkit/toolbox-utxo");

        await checkBtcAppAndCreateTransportWebUSB(false);

        const { bitcoinAddress: address } = await btcApp.getWalletPublicKey(derivationPath, {
          format,
        });

        if (!address) {
          throw new SwapKitError("wallet_ledger_get_address_error", {
            message: `Cannot get ${chain} address from ledger derivation path: ${derivationPath}`,
          });
        }

        return chain === "bitcoin-cash" && format === "legacy"
          ? toCashAddress(address).replace(/(bchtest:|bitcoincash:)/, "")
          : address;
      },
    };
  };
};

export const BitcoinLedger = BaseLedgerUTXO({ chain: "bitcoin" });
export const LitecoinLedger = BaseLedgerUTXO({ chain: "litecoin" });

export const BitcoinCashLedger = BaseLedgerUTXO({
  chain: "bitcoin-cash",
  additionalSignParams: { segwit: false, additionals: ["abc"], sigHashType: 0x41 },
});

export const DogecoinLedger = BaseLedgerUTXO({
  chain: "dogecoin",
  additionalSignParams: { additionals: [], segwit: false, useTrustedInputForSegwit: false },
});

export const DashLedger = BaseLedgerUTXO({
  chain: "dash",
  additionalSignParams: { additionals: [], segwit: false, useTrustedInputForSegwit: false },
});
