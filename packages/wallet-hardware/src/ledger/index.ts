import {
  Chain,
  type DerivationPathArray,
  FeeOption,
  filterSupportedChains,
  type GenericTransferParams,
  getRPCUrl,
  SwapKitError,
  THORConfig,
  WalletOption,
} from "@swapkit/helpers";
import type { ThorchainDepositParams } from "@swapkit/toolboxes/cosmos";
import type { UTXOBuildTxParams } from "@swapkit/toolboxes/utxo";

import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import { getLedgerAddress, getLedgerClient } from "./helpers";

export const ledgerWallet = createWallet({
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectLedger(chains: Chain[], derivationPath?: DerivationPathArray) {
      const [chain] = filterSupportedChains({ chains, supportedChains, walletType });

      if (!chain) return false;

      const walletMethods = await getWalletMethods({ chain, derivationPath });

      addChain({ ...walletMethods, chain, walletType: WalletOption.LEDGER });

      return true;
    },
  name: "connectLedger",
  supportedChains: [
    Chain.Arbitrum,
    Chain.Aurora,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Gnosis,
    Chain.Litecoin,
    Chain.Near,
    Chain.Optimism,
    Chain.Polygon,
    Chain.Ripple,
    Chain.THORChain,
    Chain.XLayer,
    Chain.Tron,
    Chain.Zcash,
  ],
  walletType: WalletOption.LEDGER,
});

export const LEDGER_SUPPORTED_CHAINS = getWalletSupportedChains(ledgerWallet);

// reduce memo length by removing trade limit
function reduceMemo(memo?: string, affiliateAddress = "t") {
  if (!memo?.includes("=:")) return memo;

  const removedAffiliate = memo.includes(`:${affiliateAddress}:`) ? memo.split(`:${affiliateAddress}:`)[0] : memo;

  return removedAffiliate?.substring(0, removedAffiliate.lastIndexOf(":"));
}

function recursivelyOrderKeys(unordered: any) {
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
}

function stringifyKeysInOrder(data: any) {
  return JSON.stringify(recursivelyOrderKeys(data));
}

async function getWalletMethods({ chain, derivationPath }: { chain: Chain; derivationPath?: DerivationPathArray }) {
  switch (chain) {
    case Chain.BitcoinCash:
    case Chain.Bitcoin:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin:
    case Chain.Zcash: {
      const { getUtxoToolbox } = await import("@swapkit/toolboxes/utxo");
      const toolbox = await getUtxoToolbox(chain as typeof Chain.Bitcoin);

      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });

      const transfer = async (params: UTXOBuildTxParams) => {
        const feeRate = params.feeRate || (await toolbox.getFeeRates())[FeeOption.Average];
        const memo = [Chain.Bitcoin].includes(chain as typeof Chain.Bitcoin) ? params.memo : reduceMemo(params.memo);

        const { psbt, inputs } = await toolbox.createTransaction({
          ...params,
          feeRate,
          fetchTxHex: true,
          memo,
          sender: address,
        });
        const txHex = await signer.signTransaction(psbt, inputs);
        const tx = await toolbox.broadcastTx(txHex);

        return tx;
      };

      return { ...toolbox, address, transfer };
    }

    case Chain.Ethereum:
    case Chain.Avalanche:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.BinanceSmartChain:
    case Chain.Base:
    case Chain.Aurora:
    case Chain.Gnosis:
    case Chain.XLayer: {
      const { getEvmToolbox } = await import("@swapkit/toolboxes/evm");
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });
      const toolbox = await getEvmToolbox(chain, { signer });

      return { ...toolbox, address };
    }

    case Chain.Cosmos: {
      const { createSigningStargateClient, getMsgSendDenom, getCosmosToolbox } = await import(
        "@swapkit/toolboxes/cosmos"
      );
      const toolbox = await getCosmosToolbox(Chain.Cosmos);
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });

      const transfer = async ({ assetValue, recipient, memo }: GenericTransferParams) => {
        if (!assetValue) throw new SwapKitError("wallet_ledger_invalid_asset");

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

        const rpcUrl = await getRPCUrl(chain);
        const signingClient = await createSigningStargateClient(rpcUrl, signer, "0.007uatom");

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
      const importedSigning = await import("@cosmjs/proto-signing");
      const encodePubkey = importedSigning.encodePubkey ?? importedSigning.default?.encodePubkey;
      const makeAuthInfoBytes = importedSigning.makeAuthInfoBytes ?? importedSigning.default?.makeAuthInfoBytes;
      const {
        createStargateClient,
        buildEncodedTxBody,
        getCosmosToolbox,
        buildAminoMsg,
        getDefaultChainFee,
        fromBase64,
        parseAminoMessageForDirectSigning,
      } = await import("@swapkit/toolboxes/cosmos");
      const toolbox = await getCosmosToolbox(chain);
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });

      const fee = getDefaultChainFee(chain);
      const { pubkey: value, signTransaction, sign: signMessage } = signer;

      // ANCHOR (@Chillios): Same parts in methods + can extract StargateClient init to toolbox
      const thorchainTransfer = async ({
        memo = "",
        assetValue,
        ...rest
      }: GenericTransferParams | ThorchainDepositParams) => {
        const account = await toolbox.getAccount(address);
        if (!account) throw new SwapKitError("wallet_ledger_invalid_account");
        if (!assetValue) throw new SwapKitError("wallet_ledger_invalid_asset");
        if (!value) throw new SwapKitError("wallet_ledger_pubkey_not_found");

        const { accountNumber, sequence: sequenceNumber } = account;
        const sequence = (sequenceNumber || 0).toString();

        const orderedMessages = recursivelyOrderKeys([buildAminoMsg({ assetValue, memo, sender: address, ...rest })]);

        // get tx signing msg
        const rawSendTx = stringifyKeysInOrder({
          account_number: accountNumber?.toString(),
          chain_id: THORConfig.chainId,
          fee,
          memo,
          msgs: orderedMessages,
          sequence,
        });

        const signatures = await signTransaction(rawSendTx, sequence);
        if (!signatures) throw new SwapKitError("wallet_ledger_signing_error");

        const pubkey = encodePubkey({ type: "tendermint/PubKeySecp256k1", value });
        const msgs = orderedMessages.map(parseAminoMessageForDirectSigning);
        const bodyBytes = await buildEncodedTxBody({ chain, memo, msgs });

        const authInfoBytes = makeAuthInfoBytes(
          [{ pubkey, sequence: Number(sequence) }],
          fee.amount,
          Number.parseInt(fee.gas, 10),
          undefined,
          undefined,
          SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
        );

        const signature = signatures?.[0]?.signature ? fromBase64(signatures[0].signature) : Uint8Array.from([]);

        const txRaw = TxRaw.fromPartial({ authInfoBytes, bodyBytes, signatures: [signature] });
        const txBytes = TxRaw.encode(txRaw).finish();
        const rpcUrl = await getRPCUrl(Chain.THORChain);

        const broadcaster = await createStargateClient(rpcUrl);
        const { transactionHash } = await broadcaster.broadcastTx(txBytes);

        return transactionHash;
      };

      const transfer = (params: GenericTransferParams) => thorchainTransfer(params);
      const deposit = (params: ThorchainDepositParams) => thorchainTransfer(params);

      return { ...toolbox, address, deposit, signMessage, transfer };
    }

    case Chain.Near: {
      const { getNearToolbox } = await import("@swapkit/toolboxes/near");
      const signer = await getLedgerClient({ chain, derivationPath });
      const accountId = await signer.getAddress();
      const toolbox = await getNearToolbox({ signer });

      return { ...toolbox, address: accountId };
    }

    case Chain.Ripple: {
      const { getRippleToolbox } = await import("@swapkit/toolboxes/ripple");
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = signer.getAddress();
      const toolbox = await getRippleToolbox({ signer });

      return { ...toolbox, address };
    }

    case Chain.Tron: {
      const { createTronToolbox } = await import("@swapkit/toolboxes/tron");
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });
      const toolbox = await createTronToolbox({ signer });

      return { ...toolbox, address };
    }

    default:
      throw new SwapKitError("wallet_ledger_chain_not_supported", { chain });
  }
}
