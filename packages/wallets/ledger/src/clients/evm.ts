import type EthereumApp from "@ledgerhq/hw-app-eth";
import {
  ChainId,
  type DerivationPathArray,
  NetworkDerivationPath,
  derivationPathToString,
} from "@swapkit/helpers";
import {
  AbstractSigner,
  type Provider,
  Signature,
  Transaction,
  type TransactionRequest,
} from "ethers";

import { getLedgerTransport } from "../helpers/getLedgerTransport";

class EVMLedgerInterface extends AbstractSigner {
  public chainId: ChainId = ChainId.Ethereum;
  public derivationPath = "";
  public ledgerApp: InstanceType<typeof EthereumApp> | null = null;
  public ledgerTimeout = 50000;

  constructor({
    provider,
    derivationPath = NetworkDerivationPath.OP,
    chainId = ChainId.Optimism,
  }: {
    provider: Provider;
    derivationPath?: DerivationPathArray | string;
    chainId?: ChainId;
  }) {
    super(provider);

    this.chainId = chainId || ChainId.Ethereum;
    this.derivationPath =
      typeof derivationPath === "string" ? derivationPath : derivationPathToString(derivationPath);

    Object.defineProperty(this, "provider", {
      enumerable: true,
      value: provider || null,
      writable: false,
    });
  }

  connect = (provider: Provider) =>
    new EVMLedgerInterface({
      provider,
      derivationPath: this.derivationPath,
      chainId: this.chainId,
    });

  checkOrCreateTransportAndLedger = async () => {
    if (this.ledgerApp) return;
    await this.createTransportAndLedger();
  };

  createTransportAndLedger = async () => {
    const transport = await getLedgerTransport();
    const { default: EthereumApp } = await import("@ledgerhq/hw-app-eth");

    this.ledgerApp = new EthereumApp(transport);
  };

  getAddress = async () => {
    const response = await this.getAddressAndPubKey();
    if (!response) throw new Error("Could not get Address");
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
    await this.createTransportAndLedger();

    const sig = await this.ledgerApp?.signPersonalMessage(this.derivationPath, messageHex);

    if (!sig) throw new Error("Signing failed");

    sig.r = `0x${sig.r}`;
    sig.s = `0x${sig.s}`;
    return Signature.from(sig).serialized;
  };

  // TODO: fix typing infer from ethers
  sendTransaction = async (tx: TransactionRequest): Promise<any> => {
    if (!this.provider) throw new Error("No provider set");

    const signedTxHex = await this.signTransaction(tx);

    return await this.provider.broadcastTransaction(signedTxHex);
  };

  signTypedData(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  signTransaction = async (tx: TransactionRequest) => {
    await this.createTransportAndLedger();

    const transactionCount = await this.provider?.getTransactionCount(
      tx.from || (await this.getAddress()),
    );

    const baseTx = {
      chainId: tx.chainId || this.chainId,
      data: tx.data,
      gasLimit: tx.gasLimit,
      ...(tx.gasPrice && { gasPrice: tx.gasPrice }),
      ...(!tx.gasPrice &&
        tx.maxFeePerGas && {
          maxFeePerGas: tx.maxFeePerGas,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        }),
      nonce:
        tx.nonce !== undefined
          ? Number((tx.nonce || transactionCount || 0).toString())
          : transactionCount,
      to: tx.to?.toString(),
      value: tx.value,
      type: tx.type && !Number.isNaN(tx.type) ? tx.type : tx.maxFeePerGas ? 2 : 0,
    };

    // ledger expects the tx to be serialized without the 0x prefix
    const unsignedTx = Transaction.from(baseTx).unsignedSerialized.slice(2);

    const { ledgerService } = await import("@ledgerhq/hw-app-eth");

    const resolution = await ledgerService.resolveTransaction(
      unsignedTx,
      {},
      { externalPlugins: true, erc20: true },
    );

    const signature = await this.ledgerApp?.signTransaction(
      this.derivationPath,
      unsignedTx,
      resolution,
    );

    if (!signature) throw new Error("Could not sign transaction");

    const { r, s, v } = signature;

    return Transaction.from({
      ...baseTx,
      signature: { v: Number(BigInt(v)), r: `0x${r}`, s: `0x${s}` },
    }).serialized;
  };
}

type LedgerParams = { provider: Provider; derivationPath?: DerivationPathArray };

export const EthereumLedger = ({ provider, derivationPath }: LedgerParams) =>
  new EVMLedgerInterface({ chainId: ChainId.Ethereum, provider, derivationPath });

export const AvalancheLedger = ({ provider, derivationPath }: LedgerParams) =>
  new EVMLedgerInterface({ chainId: ChainId.Avalanche, provider, derivationPath });

export const BinanceSmartChainLedger = ({ provider, derivationPath }: LedgerParams) =>
  new EVMLedgerInterface({ chainId: ChainId.BinanceSmartChain, provider, derivationPath });

export const ArbitrumLedger = ({ provider, derivationPath }: LedgerParams) =>
  new EVMLedgerInterface({ chainId: ChainId.Arbitrum, provider, derivationPath });

export const PolygonLedger = ({ provider, derivationPath }: LedgerParams) =>
  new EVMLedgerInterface({ chainId: ChainId.Polygon, provider, derivationPath });

export const OptimismLedger = ({ provider, derivationPath }: LedgerParams) =>
  new EVMLedgerInterface({ chainId: ChainId.Optimism, provider, derivationPath });

export const BaseLedger = ({ provider, derivationPath }: LedgerParams) =>
  new EVMLedgerInterface({ chainId: ChainId.Base, provider, derivationPath });
