import type EthereumApp from "@ledgerhq/hw-app-eth";
import {
  ChainId,
  type DerivationPathArray,
  derivationPathToString,
  NetworkDerivationPath,
  SwapKitError,
} from "@swapkit/helpers";
import { AbstractSigner, type Provider, type TransactionRequest } from "ethers";

import { getLedgerTransport } from "../helpers/getLedgerTransport";

class EVMLedgerInterface extends AbstractSigner {
  chainId: ChainId = ChainId.Ethereum;
  derivationPath = "";
  ledgerApp: InstanceType<typeof EthereumApp> | null = null;
  ledgerTimeout = 50000;

  constructor({
    provider,
    derivationPath = NetworkDerivationPath.OP,
    chainId = ChainId.Optimism,
  }: { provider: Provider; derivationPath?: DerivationPathArray | string; chainId?: ChainId }) {
    super(provider);

    this.chainId = chainId || ChainId.Ethereum;
    this.derivationPath = typeof derivationPath === "string" ? derivationPath : derivationPathToString(derivationPath);

    Object.defineProperty(this, "provider", { enumerable: true, value: provider || null, writable: false });
  }

  connect = (provider: Provider) =>
    new EVMLedgerInterface({ chainId: this.chainId, derivationPath: this.derivationPath, provider });

  checkOrCreateTransportAndLedger = async () => {
    if (this.ledgerApp) return;
    await this.createTransportAndLedger();
  };

  createTransportAndLedger = async () => {
    const transport = await getLedgerTransport();
    const EthereumApp = (await import("@ledgerhq/hw-app-eth")).default;

    this.ledgerApp = new EthereumApp(transport);
  };

  getAddress = async () => {
    const response = await this.getAddressAndPubKey();
    if (!response) throw new SwapKitError("wallet_ledger_failed_to_get_address");
    return response.address;
  };

  getAddressAndPubKey = async () => {
    await this.createTransportAndLedger();
    return this.ledgerApp?.getAddress(this.derivationPath);
  };

  showAddressAndPubKey = async () => {
    await this.createTransportAndLedger();
    return this.ledgerApp?.getAddress(this.derivationPath, true);
  };

  signMessage = async (messageHex: string) => {
    const { Signature } = await import("ethers");
    await this.createTransportAndLedger();

    const sig = await this.ledgerApp?.signPersonalMessage(this.derivationPath, messageHex);

    if (!sig) throw new SwapKitError("wallet_ledger_signing_error");

    sig.r = `0x${sig.r}`;
    sig.s = `0x${sig.s}`;
    return Signature.from(sig).serialized;
  };

  sendTransaction = async (tx: TransactionRequest): Promise<any> => {
    if (!this.provider) throw new SwapKitError("wallet_ledger_no_provider");

    const signedTxHex = await this.signTransaction(tx);

    return await this.provider.broadcastTransaction(signedTxHex);
  };

  signTypedData(): Promise<string> {
    throw new SwapKitError("wallet_ledger_method_not_supported", { method: "signTypedData" });
  }

  signTransaction = async (tx: TransactionRequest) => {
    const { Transaction } = await import("ethers");
    await this.createTransportAndLedger();

    const transactionCount = await this.provider?.getTransactionCount(tx.from || (await this.getAddress()));

    const baseTx = {
      chainId: tx.chainId || this.chainId,
      data: tx.data,
      gasLimit: tx.gasLimit,
      ...(tx.gasPrice && { gasPrice: tx.gasPrice }),
      ...(!tx.gasPrice &&
        tx.maxFeePerGas && { maxFeePerGas: tx.maxFeePerGas, maxPriorityFeePerGas: tx.maxPriorityFeePerGas }),
      nonce: tx.nonce !== undefined ? Number((tx.nonce || transactionCount || 0).toString()) : transactionCount,
      to: tx.to?.toString(),
      type: tx.type && !Number.isNaN(tx.type) ? tx.type : tx.maxFeePerGas ? 2 : 0,
      value: tx.value,
    };

    // ledger expects the tx to be serialized without the 0x prefix
    const unsignedTx = Transaction.from(baseTx).unsignedSerialized.slice(2);

    const { ledgerService } = await import("@ledgerhq/hw-app-eth");

    const resolution = await ledgerService.resolveTransaction(unsignedTx, {}, { erc20: true, externalPlugins: true });

    const signature = await this.ledgerApp?.signTransaction(this.derivationPath, unsignedTx, resolution);

    if (!signature) throw new SwapKitError("wallet_ledger_signing_error");

    const { r, s, v } = signature;

    return Transaction.from({ ...baseTx, signature: { r: `0x${r}`, s: `0x${s}`, v: Number(BigInt(v)) } }).serialized;
  };
}

type LedgerParams = { provider: Provider; derivationPath?: DerivationPathArray };

export const ArbitrumLedger = (params: LedgerParams) =>
  new EVMLedgerInterface({ ...params, chainId: ChainId.Arbitrum });
export const AuroraLedger = (params: LedgerParams) => new EVMLedgerInterface({ ...params, chainId: ChainId.Aurora });
export const AvalancheLedger = (params: LedgerParams) =>
  new EVMLedgerInterface({ ...params, chainId: ChainId.Avalanche });
export const BaseLedger = (params: LedgerParams) => new EVMLedgerInterface({ ...params, chainId: ChainId.Base });
export const EthereumLedger = (params: LedgerParams) =>
  new EVMLedgerInterface({ ...params, chainId: ChainId.Ethereum });
export const GnosisLedger = (params: LedgerParams) => new EVMLedgerInterface({ ...params, chainId: ChainId.Gnosis });
export const OptimismLedger = (params: LedgerParams) =>
  new EVMLedgerInterface({ ...params, chainId: ChainId.Optimism });
export const PolygonLedger = (params: LedgerParams) => new EVMLedgerInterface({ ...params, chainId: ChainId.Polygon });
export const BinanceSmartChainLedger = (params: LedgerParams) =>
  new EVMLedgerInterface({ ...params, chainId: ChainId.BinanceSmartChain });
