import { AssetValue, Chain, getChainConfig, SwapKitError, SwapKitNumber } from "@swapkit/helpers";
import type { Cell, OpenedContract, TonClient, WalletContractV4 } from "@ton/ton";
import { match, P } from "ts-pattern";

import type { TONSigner, TONToolboxParams, TONTransferParams } from "./types";

export async function getTONToolbox(toolboxParams: TONToolboxParams = {}) {
  const { mnemonicToWalletKey } = await import("@ton/crypto");
  const { Address, TonClient, WalletContractV4 } = await import("@ton/ton");
  const validateAddress = await getTONAddressValidator();
  let client: TonClient;
  let wallet: OpenedContract<WalletContractV4>;

  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, async ({ phrase }) => mnemonicToWalletKey(phrase.split(" ")))
    .with({ signer: P.any }, ({ signer }) => signer as TONSigner)
    .otherwise(() => undefined);

  function getClient() {
    const { rpcUrls } = getChainConfig(Chain.Ton);
    const [endpoint] = rpcUrls;

    if (!client || client.parameters.endpoint !== endpoint) {
      client = new TonClient({ endpoint });
    }

    return client;
  }

  function getWallet(paramSigner?: TONSigner) {
    if (!wallet || paramSigner) {
      const client = getClient();
      const walletSigner = paramSigner || signer;

      if (!walletSigner) {
        throw new SwapKitError("core_wallet_connection_not_found");
      }

      const walletContract = WalletContractV4.create({ publicKey: walletSigner.publicKey, workchain: 0 });
      const contract = client.open(walletContract);

      wallet = contract;
    }

    return wallet;
  }

  async function getBalance(address: string) {
    const client = getClient();
    const { baseDecimal } = getChainConfig(Chain.Ton);

    try {
      const balance = await client.getBalance(Address.parse(address));
      return [AssetValue.from({ chain: Chain.Ton, value: SwapKitNumber.fromBigInt(balance, baseDecimal) })];
    } catch (error) {
      throw new SwapKitError("core_wallet_connection_not_found", { error });
    }
  }

  async function createTransaction({ assetValue, recipient, memo }: TONTransferParams) {
    const wallet = getWallet();
    if (!wallet || !signer) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    const { toNano, comment, internal } = await import("@ton/ton");
    const seqno = await wallet.getSeqno();
    const amount = toNano(assetValue.getValue("string"));
    const messageBody = memo ? comment(memo) : undefined;

    const transfer = wallet.createTransfer({
      messages: [internal({ body: messageBody, to: recipient, value: amount })],
      secretKey: signer.secretKey,
      seqno,
    });

    return transfer;
  }

  async function transfer({ assetValue, recipient, memo }: TONTransferParams) {
    const wallet = getWallet();
    if (!wallet || !signer) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    const transfer = await createTransaction({ assetValue, memo, recipient });
    await wallet.send(transfer);

    return transfer.hash().toString();
  }

  async function sendTransaction(transferCell: Cell) {
    const wallet = getWallet();
    if (!wallet) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    try {
      await wallet.send(transferCell);
      return transferCell.hash().toString("hex");
    } catch (error) {
      throw new SwapKitError("core_wallet_connection_not_found", { error });
    }
  }

  function getAddress() {
    const wallet = getWallet();
    return wallet.address.toString();
  }

  function estimateTransactionFee() {
    return Promise.resolve(AssetValue.from({ chain: Chain.Ton, value: "0.0001" }));
  }

  return {
    createTransaction,
    estimateTransactionFee,
    getAddress,
    getBalance,
    sendTransaction,
    transfer,
    validateAddress,
  };
}

export async function getTONAddressValidator() {
  const { Address } = await import("@ton/ton");
  return function validateAddress(address: string) {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  };
}
