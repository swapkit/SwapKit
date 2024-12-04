import type {
  Account,
  BitcoinTransaction,
  CosmosTransaction,
  EthereumTransaction,
  Transaction,
} from "@ledgerhq/wallet-api-client";
import { FAMILIES, WalletAPIClient, WindowMessageTransport } from "@ledgerhq/wallet-api-client";
import {
  AssetValue,
  BaseDecimal,
  Chain,
  type ConnectWalletParams,
  FeeOption,
  SwapKitError,
  SwapKitNumber,
  type WalletChain,
  WalletOption,
  setRequestClientConfig,
} from "@swapkit/helpers";
import { ETHToolbox, getProvider } from "@swapkit/toolbox-evm";
import type { UTXOTransferParams } from "@swapkit/toolbox-utxo";
import { BigNumber as BigNumberJS } from "bignumber.js";
import { VoidSigner } from "ethers";

export type LedgerAccount = Account & { multichainBalance?: AssetValue[] };

export type LedgerLiveTransaction = Transaction;
export const LEDGER_LIVE_FAMILIES = FAMILIES;

export enum LedgerLiveChain {
  BTC = "bitcoin",
  BCH = "bitcoin_cash",
  LTC = "litecoin",
  DOGE = "dogecoin",
  ETH = "ethereum",
  ARB = "arbitrum",
  ATOM = "cosmos",
}

export const LEDGER_LIVE_SUPPORTED_CHAINS = [
  Chain.Bitcoin,
  Chain.Ethereum,
  Chain.Cosmos,
  Chain.Litecoin,
  Chain.Dogecoin,
  Chain.BitcoinCash,
] as WalletChain[];

export const ChainToLedgerLiveChain: Partial<Record<Chain, LedgerLiveChain>> = {
  [Chain.Arbitrum]: LedgerLiveChain.ARB,
  [Chain.BitcoinCash]: LedgerLiveChain.BCH,
  [Chain.Bitcoin]: LedgerLiveChain.BTC,
  [Chain.Cosmos]: LedgerLiveChain.ATOM,
  [Chain.Dogecoin]: LedgerLiveChain.DOGE,
  [Chain.Ethereum]: LedgerLiveChain.ETH,
  [Chain.Litecoin]: LedgerLiveChain.LTC,
};

export const LedgerLiveChainToChain = {
  [LedgerLiveChain.ARB]: Chain.Arbitrum,
  [LedgerLiveChain.ATOM]: Chain.Cosmos,
  [LedgerLiveChain.BCH]: Chain.BitcoinCash,
  [LedgerLiveChain.BTC]: Chain.Bitcoin,
  [LedgerLiveChain.DOGE]: Chain.Dogecoin,
  [LedgerLiveChain.ETH]: Chain.Ethereum,
  [LedgerLiveChain.LTC]: Chain.Litecoin,
};

export const LedgerCurrencyToAsset = {
  arbitrum: AssetValue.from({ chain: Chain.Arbitrum }),
  bitcoin: AssetValue.from({ chain: Chain.Bitcoin }),
  bitcoin_cash: AssetValue.from({ chain: Chain.BitcoinCash }),
  cosmos: AssetValue.from({ chain: Chain.Cosmos }),
  dogecoin: AssetValue.from({ chain: Chain.Dogecoin }),
  ethereum: AssetValue.from({ chain: Chain.Ethereum }),
  litecoin: AssetValue.from({ chain: Chain.Litecoin }),
};

export const isLedgerLiveSupportedOutputAsset = (assetInput: AssetValue) =>
  [
    Chain.Arbitrum,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
  ].includes(assetInput.chain);

export const isLedgerLiveSupportedInputAsset = (assetInput: AssetValue) =>
  [
    AssetValue.from({ chain: Chain.Arbitrum }),
    AssetValue.from({ chain: Chain.Bitcoin }),
    AssetValue.from({ chain: Chain.BitcoinCash }),
    AssetValue.from({ chain: Chain.Cosmos }),
    AssetValue.from({ chain: Chain.Dogecoin }),
    AssetValue.from({ chain: Chain.Ethereum }),
    AssetValue.from({ chain: Chain.Litecoin }),
    AssetValue.from({ asset: "ARB.USDC-0XAF88D065E77C8CC2239327C5EDB3A432268E5831" }),
    AssetValue.from({ asset: "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48" }),
    AssetValue.from({ asset: "ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7" }),
  ].find((asset) => asset.eq(assetInput));

export const LedgerLive = () => {
  const transport = new WindowMessageTransport();

  connect();

  const apiClient = new WalletAPIClient(transport);

  function connect() {
    transport.connect();
  }

  function disconnect() {
    transport.disconnect();
  }

  function listAccounts(chain: Chain) {
    if (!ChainToLedgerLiveChain[chain])
      throw new Error(`Ledger connect is not supported for ${chain} chain`);
    return apiClient.account.list({
      currencyIds: [ChainToLedgerLiveChain[chain]],
    });
  }

  function requestAccounts(chains?: Chain[]) {
    const filterdChains = chains?.filter((chain) => chain in LEDGER_LIVE_SUPPORTED_CHAINS);
    if (filterdChains?.length === 0) return Promise.resolve([]);
    return apiClient.account.request({
      currencyIds: (filterdChains || LEDGER_LIVE_SUPPORTED_CHAINS).map(
        (chain) => ChainToLedgerLiveChain[chain] as string,
      ),
    });
  }

  function signTransaction(
    accountId: string,
    transaction: LedgerLiveTransaction,
    params?: {
      /**
       * The name of the Ledger Nano app to use for the signing process
       */
      hwAppId: string;
    },
  ) {
    return apiClient.transaction.signAndBroadcast(accountId, transaction, params);
  }

  return {
    apiClient,
    connect,
    disconnect,
    listAccounts,
    requestAccounts,
    signTransaction,
  };
};

export const getLedgerLiveWallet = async ({
  chain,
  ledgerLiveAccount,
  ethplorerApiKey,
}: { chain: Chain; ledgerLiveAccount: LedgerAccount; ethplorerApiKey?: string }) => {
  switch (chain) {
    case Chain.Arbitrum:
    case Chain.Ethereum: {
      const getAddress = () => ledgerLiveAccount.address;

      const ledgerLiveClient = EthereumLedgerLive();

      const provider = getProvider(Chain.Ethereum);

      const toolbox = ETHToolbox({
        provider,
        signer: new VoidSigner(ledgerLiveAccount.address, provider),
        ethplorerApiKey,
      });

      const sendTransaction = async (unsignedTx: any) => {
        const signedTx = await ledgerLiveClient?.signTransaction(ledgerLiveAccount.id, {
          recipient: unsignedTx.to,
          data: Buffer.from(unsignedTx.data?.substring(2) || "", "hex"),
          amount: new BigNumberJS(unsignedTx.value || 0),
          family: LEDGER_LIVE_FAMILIES[1],
        });
        if (!signedTx) throw new Error("Could not sign transaction");
        return signedTx;
      };

      const transfer = async ({
        assetValue,
        memo,
        recipient,
      }: {
        assetValue: AssetValue;
        memo: string;
        recipient: string;
      }) => {
        if (!assetValue) throw new Error("invalid asset");
        const signedTx = await ledgerLiveClient?.signTransaction(ledgerLiveAccount.id, {
          recipient,
          data: Buffer.from(memo || ""),
          amount: new BigNumberJS(assetValue.getBaseValue("string")),
          family: LEDGER_LIVE_FAMILIES[1],
        });

        if (!signedTx) throw new Error("Could not sign transaction");

        return signedTx;
      };

      return {
        ...toolbox,
        getAddress,
        address: getAddress(),
        transfer,
        sendTransaction,
      };
    }

    case Chain.Cosmos: {
      const { GaiaToolbox } = await import("@swapkit/toolbox-cosmos");
      const ledgerLiveClient = CosmosLedgerLive();
      const toolbox = GaiaToolbox();

      const getAddress = () => ledgerLiveAccount.address;

      const getBalance = async () => {
        const balance = (await ledgerLiveClient.listAccounts(chain)).find(
          (account) => account.id === ledgerLiveAccount.id,
        )?.balance;

        return [
          AssetValue.from({
            chain: Chain.Cosmos,
            value: SwapKitNumber.fromBigInt(
              BigInt(balance?.toString(10) || "0"),
              BaseDecimal.GAIA,
            ).getValue("string"),
          }),
        ];
      };

      const sendTransaction = async (unsignedTx: any) => {
        const signedTx = await ledgerLiveClient?.signTransaction(ledgerLiveAccount.id, {
          family: LEDGER_LIVE_FAMILIES[5],
          recipient: unsignedTx.to,
          amount: new BigNumberJS(unsignedTx.value || 0),
          memo: unsignedTx.memo || "",
          mode: "send",
        });
        if (!signedTx) throw new Error("Could not sign transaction");
        return signedTx;
      };

      const transfer = async ({
        assetValue,
        memo,
        recipient,
      }: {
        assetValue: AssetValue;
        memo: string;
        recipient: string;
      }) => {
        if (!assetValue) throw new Error("invalid asset");
        const signedTx = await ledgerLiveClient?.signTransaction(ledgerLiveAccount.id, {
          family: LEDGER_LIVE_FAMILIES[5],
          recipient,
          amount: new BigNumberJS(assetValue.getBaseValue("string")),
          memo,
          mode: "send",
        });

        if (!signedTx) throw new Error("Could not sign transaction");

        return signedTx;
      };

      return {
        ...toolbox,
        getBalance,
        getAddress,
        address: getAddress(),
        transfer,
        sendTransaction,
      };
    }
    case Chain.Litecoin:
    case Chain.BitcoinCash:
    case Chain.Dogecoin:
    case Chain.Bitcoin: {
      const ledgerLiveClient = BitcoinLedgerLive();
      const { BTCToolbox, LTCToolbox, BCHToolbox, DOGEToolbox } = await import(
        "@swapkit/toolbox-utxo"
      );
      const toolbox =
        chain === Chain.Bitcoin
          ? BTCToolbox({})
          : chain === Chain.Litecoin
            ? LTCToolbox({})
            : chain === Chain.BitcoinCash
              ? BCHToolbox({})
              : DOGEToolbox({});

      const getAddress = () => ledgerLiveAccount.address;

      const getBalance = async () => {
        const balance = (await ledgerLiveClient.listAccounts(chain)).find(
          (account) => account.id === ledgerLiveAccount.id,
        )?.balance;

        return [
          AssetValue.from({
            chain,
            value: SwapKitNumber.fromBigInt(
              BigInt(balance?.toString(10) || "0"),
              BaseDecimal.BTC,
            ).getValue("string"),
          }),
        ];
      };

      const sendTransaction = async (unsignedTx: any) => {
        const signedTx = await ledgerLiveClient?.signTransaction(ledgerLiveAccount.id, {
          recipient: unsignedTx.to,
          opReturnData: Buffer.from(unsignedTx.memo || ""),
          amount: new BigNumberJS(unsignedTx.value || 0),
          family: LEDGER_LIVE_FAMILIES[0],
        });
        if (!signedTx) throw new Error("Could not sign transaction");
        return signedTx;
      };

      const transfer = async ({ assetValue, memo, recipient, feeRate }: UTXOTransferParams) => {
        if (!assetValue) throw new Error("invalid asset");
        const gasPrice = (await toolbox.getFeeRates())[FeeOption.Average];
        const signedTx = await ledgerLiveClient?.signTransaction(ledgerLiveAccount.id, {
          recipient,
          opReturnData: Buffer.from(memo || ""),
          amount: new BigNumberJS(assetValue.getBaseValue("string")),
          feePerByte: feeRate ? new BigNumberJS(Math.max(feeRate, gasPrice)) : undefined,
          family: LEDGER_LIVE_FAMILIES[0],
        });

        if (!signedTx) throw new Error("Could not sign transaction");

        return signedTx;
      };

      return {
        ...toolbox,
        getBalance,
        getAddress,
        address: getAddress(),
        transfer,
        sendTransaction,
      };
    }
    default:
      throw new SwapKitError("wallet_chain_not_supported");
  }
};

export const EthereumLedgerLive = () => {
  const baseLedgerLiveClient = LedgerLive();

  function signTransaction(
    accountId: string,
    transaction: EthereumTransaction,
    params?: { hwAppId: string } | undefined,
  ) {
    return baseLedgerLiveClient.apiClient.transaction.signAndBroadcast(
      accountId,
      transaction,
      params,
    );
  }

  return {
    ...baseLedgerLiveClient,
    signTransaction,
  };
};

export const BitcoinLedgerLive = () => {
  const baseLedgerLiveClient = LedgerLive();

  function signTransaction(
    accountId: string,
    transaction: BitcoinTransaction,
    params?: { hwAppId: string } | undefined,
  ) {
    return baseLedgerLiveClient.apiClient.transaction.signAndBroadcast(
      accountId,
      transaction,
      params,
    );
  }

  return {
    ...baseLedgerLiveClient,
    signTransaction,
  };
};

export const CosmosLedgerLive = () => {
  const baseLedgerLiveClient = LedgerLive();

  function signTransaction(
    accountId: string,
    transaction: CosmosTransaction,
    params?: { hwAppId: string } | undefined,
  ) {
    return baseLedgerLiveClient.apiClient.transaction.signAndBroadcast(
      accountId,
      transaction,
      params,
    );
  }

  return {
    ...baseLedgerLiveClient,
    signTransaction,
  };
};

function connectLedgerLive({
  addChain,
  config: { thorswapApiKey, ethplorerApiKey },
}: ConnectWalletParams) {
  return async function connectLedgerLive(
    chains: (typeof LEDGER_LIVE_SUPPORTED_CHAINS)[number][],
    ledgerLiveAccount: LedgerAccount,
  ) {
    const [chain] = chains;
    if (!chain) return false;

    setRequestClientConfig({ apiKey: thorswapApiKey });

    const toolbox = await getLedgerLiveWallet({ chain, ledgerLiveAccount, ethplorerApiKey });

    addChain({ ...toolbox, chain, balance: [], walletType: WalletOption.LEDGER_LIVE });

    return true;
  };
}

export const ledgerLiveWallet = { connectLedgerLive } as const;
