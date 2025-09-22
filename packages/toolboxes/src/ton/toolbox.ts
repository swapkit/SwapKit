import { AssetValue, Chain, getChainConfig, SwapKitError, SwapKitNumber } from "@swapkit/helpers";
import type { Cell } from "@ton/ton";
import { match, P } from "ts-pattern";

import type { TONSigner, TONToolboxParams, TONTransferParams } from "./types";

export async function getTONToolbox(toolboxParams: TONToolboxParams = {}) {
  const { mnemonicToWalletKey } = await import("@ton/crypto");
  const { Address, TonClient, WalletContractV4 } = await import("@ton/ton");
  const validateAddress = await getTONAddressValidator();

  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, async ({ phrase }) => mnemonicToWalletKey(phrase.split(" ")))
    .with({ signer: P.any }, ({ signer }) => signer as TONSigner)
    .otherwise(() => Promise.resolve(undefined));

  function getClient() {
    const { rpcUrl } = getChainConfig(Chain.Ton);
    return new TonClient({ endpoint: rpcUrl });
  }

  function getWallet(paramSigner?: TONSigner) {
    const client = getClient();
    const walletSigner = paramSigner || signer;

    if (!walletSigner) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }
    const walletContract = WalletContractV4.create({ publicKey: walletSigner.publicKey, workchain: 0 });
    const contract = client.open(walletContract);

    return contract;
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

  async function transfer({ assetValue, recipient, memo }: TONTransferParams) {
    const wallet = getWallet();
    if (!wallet || !signer) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    const { toNano, comment, internal } = await import("@ton/ton");
    const seqno = await wallet.getSeqno();
    const amount = toNano(assetValue.getValue("string"));
    const messageBody = memo ? comment(memo) : undefined;

    await wallet.sendTransfer({
      messages: [internal({ body: messageBody, to: recipient, value: amount })],
      secretKey: signer.secretKey,
      seqno,
    });

    return `transfer_${Date.now()}`;
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

  return { estimateTransactionFee, getAddress, getBalance, sendTransaction, transfer, validateAddress };
}

export async function getTONAddressValidator() {
  const { Address } = await import("@ton/ton");
  return function validateAddress(address: string) {
    try {
      return Address.isAddress(address);
    } catch {
      return false;
    }
  };
}
