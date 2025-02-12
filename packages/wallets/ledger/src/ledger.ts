import {
  Chain,
  ChainId,
  type ConnectWalletParams,
  type DerivationPathArray,
  FeeOption,
  StagenetChain,
  WalletOption,
  filterSupportedChains,
  getRPCUrl,
  pickEvmApiKey,
  setRequestClientConfig,
} from "@swapkit/helpers";
import type { DepositParam, TransferParams } from "@swapkit/toolbox-cosmos";
import type { UTXOBuildTxParams } from "@swapkit/toolbox-utxo";

import { LEDGER_SUPPORTED_CHAINS } from "./helpers/index";
import { getLedgerAddress, getLedgerClient } from "./helpers/index";
import type { LedgerSupportedChain } from "./helpers/ledgerSupportedChains";

// reduce memo length by removing trade limit
const reduceMemo = (memo?: string, affiliateAddress = "t") => {
  if (!memo?.includes("=:")) return memo;

  const removedAffiliate = memo.includes(`:${affiliateAddress}:`)
    ? memo.split(`:${affiliateAddress}:`)[0]
    : memo;

  return removedAffiliate?.substring(0, removedAffiliate.lastIndexOf(":"));
};

const recursivelyOrderKeys = (unordered: any) => {
  // If it's an array - recursively order any
  // dictionary items within the array
  if (Array.isArray(unordered)) {
    unordered.forEach((item, index) => {
      unordered[index] = recursivelyOrderKeys(item);
    });
    return unordered;
  }

  // If it's an object - let's order the keys
  if (typeof unordered !== "object") return unordered;
  const ordered: any = {};
  const sortedKeys = Object.keys(unordered).sort();

  for (const key of sortedKeys) {
    ordered[key] = recursivelyOrderKeys(unordered[key]);
  }

  return ordered;
};

const stringifyKeysInOrder = (data: any) => JSON.stringify(recursivelyOrderKeys(data));

const getToolbox = async ({
  chain,
  apis,
  blockchairApiKey,
  covalentApiKey,
  derivationPath,
  ethplorerApiKey,
  rpcUrl,
  stagenet,
}: ConnectWalletParams["config"] & {
  apis: ConnectWalletParams["apis"];
  chain: LedgerSupportedChain;
  derivationPath?: DerivationPathArray;
  rpcUrl?: string;
  stagenet?: boolean;
}) => {
  switch (chain) {
    case Chain.BitcoinCash:
    case Chain.Bitcoin:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-utxo");
      const params = {
        apiClient: apis[chain],
        apiKey: blockchairApiKey,
        rpcUrl,
      };

      const toolbox = getToolboxByChain(chain)(params);

      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });

      const transfer = async (params: UTXOBuildTxParams) => {
        const feeRate = params.feeRate || (await toolbox.getFeeRates())[FeeOption.Average];
        const { psbt, inputs } = await toolbox.buildTx({
          ...params,
          sender: address,
          feeRate,
          memo: [Chain.Bitcoin].includes(chain) ? params.memo : reduceMemo(params.memo),
          fetchTxHex: true,
        });
        const txHex = await signer.signTransaction(psbt, inputs);

        return toolbox.broadcastTx(txHex);
      };

      return { ...toolbox, address, transfer };
    }

    case Chain.Ethereum:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.BinanceSmartChain:
    case Chain.Base: {
      const apiKey = pickEvmApiKey({
        chain,
        nonEthApiKey: covalentApiKey,
        ethApiKey: ethplorerApiKey,
      });
      const { getToolboxByChain, getProvider } = await import("@swapkit/toolbox-evm");
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });
      const provider = getProvider(chain, rpcUrl);
      const toolbox = getToolboxByChain(chain);

      return { ...toolbox({ api: apis[chain], apiKey, signer, provider }), address };
    }

    case Chain.Cosmos: {
      const { createSigningStargateClient, getMsgSendDenom, GaiaToolbox } = await import(
        "@swapkit/toolbox-cosmos"
      );
      const toolbox = GaiaToolbox();
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });

      const transfer = async ({ assetValue, recipient, memo }: TransferParams) => {
        if (!assetValue) throw new Error("invalid asset");

        const sendCoinsMessage = {
          amount: [
            {
              amount: assetValue.getBaseValue("string"),
              denom: getMsgSendDenom(`u${assetValue.symbol}`).toLowerCase(),
            },
          ],
          fromAddress: address,
          toAddress: recipient,
        };

        const signingClient = await createSigningStargateClient(
          getRPCUrl(Chain.Cosmos),
          signer,
          "0.007uatom",
        );

        const { transactionHash } = await signingClient.signAndBroadcast(
          address,
          [{ typeUrl: "/cosmos.bank.v1beta1.MsgSend", value: sendCoinsMessage }],
          2,
          memo,
        );

        return transactionHash;
      };

      return { ...toolbox, address, transfer };
    }

    case Chain.THORChain: {
      const { SignMode } = await import("cosmjs-types/cosmos/tx/signing/v1beta1/signing.js");
      const { TxRaw } = await import("cosmjs-types/cosmos/tx/v1beta1/tx.js");
      const { encodePubkey, makeAuthInfoBytes } = await import("@cosmjs/proto-signing");
      const {
        createStargateClient,
        buildEncodedTxBody,
        ThorchainToolbox,
        buildAminoMsg,
        getDefaultChainFee,
        fromBase64,
        parseAminoMessageForDirectSigning,
      } = await import("@swapkit/toolbox-cosmos");
      const toolbox = ThorchainToolbox({ stagenet: false });
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });

      const fee = getDefaultChainFee(chain);
      const { pubkey: value, signTransaction, sign: signMessage } = signer;

      // ANCHOR (@Chillios): Same parts in methods + can extract StargateClient init to toolbox
      const thorchainTransfer = async ({
        memo = "",
        assetValue,
        ...rest
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Refactor to reduce complexity
      }: TransferParams | DepositParam) => {
        const account = await toolbox.getAccount(address);
        if (!account) throw new Error("invalid account");
        if (!assetValue) throw new Error("invalid asset");

        if (!value) throw new Error("Account pubkey not found");
        const rpcUrl = stagenet ? getRPCUrl(StagenetChain.THORChain) : getRPCUrl(Chain.THORChain);

        const { accountNumber, sequence: sequenceNumber } = account;
        const sequence = (sequenceNumber || 0).toString();

        const orderedMessages = recursivelyOrderKeys([
          buildAminoMsg({ chain, from: address, assetValue, memo, ...rest }),
        ]);

        const chain_id = ChainId.THORChain;

        // get tx signing msg
        const rawSendTx = stringifyKeysInOrder({
          account_number: accountNumber?.toString(),
          chain_id,
          fee,
          memo,
          msgs: orderedMessages,
          sequence,
        });

        const signatures = await signTransaction(rawSendTx, sequence);
        if (!signatures) throw new Error("tx signing failed");

        const pubkey = encodePubkey({ type: "tendermint/PubKeySecp256k1", value });
        const msgs = orderedMessages.map(parseAminoMessageForDirectSigning);
        const bodyBytes = buildEncodedTxBody({ msgs, chain, memo });

        const authInfoBytes = makeAuthInfoBytes(
          [{ pubkey, sequence: Number(sequence) }],
          fee.amount,
          Number.parseInt(fee.gas),
          undefined,
          undefined,
          SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
        );

        const signature = signatures?.[0]?.signature
          ? fromBase64(signatures[0].signature)
          : Uint8Array.from([]);

        const txRaw = TxRaw.fromPartial({ bodyBytes, authInfoBytes, signatures: [signature] });
        const txBytes = TxRaw.encode(txRaw).finish();

        const broadcaster = await createStargateClient(rpcUrl);
        const { transactionHash } = await broadcaster.broadcastTx(txBytes);

        return transactionHash;
      };

      const transfer = (params: TransferParams) => thorchainTransfer(params);
      const deposit = (params: DepositParam) => thorchainTransfer(params);

      return { ...toolbox, address, deposit, transfer, signMessage };
    }

    default:
      throw new Error("Unsupported chain");
  }
};

function connectLedger({
  addChain,
  apis,
  rpcUrls,
  config: { thorswapApiKey, covalentApiKey, ethplorerApiKey, blockchairApiKey, stagenet },
}: ConnectWalletParams) {
  return async function connectLedger(chains: Chain[], derivationPath?: DerivationPathArray) {
    const supportedChains = filterSupportedChains(
      chains,
      LEDGER_SUPPORTED_CHAINS,
      WalletOption.LEDGER,
    );

    const [chain] = supportedChains;
    if (!chain) return false;

    setRequestClientConfig({ apiKey: thorswapApiKey });

    const toolbox = await getToolbox({
      apis,
      blockchairApiKey,
      chain,
      derivationPath,
      covalentApiKey,
      ethplorerApiKey,
      rpcUrl: rpcUrls[chain],
      stagenet,
    });

    addChain({ ...toolbox, chain, balance: [], walletType: WalletOption.LEDGER });

    return true;
  };
}

export const ledgerWallet = { connectLedger } as const;
