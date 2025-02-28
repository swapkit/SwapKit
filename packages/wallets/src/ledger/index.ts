import {
  Chain,
  type DerivationPathArray,
  FeeOption,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { UTXOBuildTxParams } from "@swapkit/toolboxes/utxo";

import { getWalletSupportedChains } from "../utils";
import { getLedgerAddress, getLedgerClient } from "./helpers/index";

export const ledgerWallet = createWallet({
  name: "connectLedger",
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dash,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
  ],
  walletType: WalletOption.LEDGER,
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectLedger(chains: Chain[], derivationPath?: DerivationPathArray) {
      const [chain] = filterSupportedChains({ chains, supportedChains, walletType });

      if (!chain) return false;

      const walletMethods = await getWalletMethods({ chain, derivationPath });

      addChain({ ...walletMethods, chain, walletType: WalletOption.LEDGER });

      return true;
    },
});

export const LEDGER_SUPPORTED_CHAINS = getWalletSupportedChains(ledgerWallet);

// reduce memo length by removing trade limit
function reduceMemo(memo?: string, affiliateAddress = "t") {
  if (!memo?.includes("=:")) return memo;

  const removedAffiliate = memo.includes(`:${affiliateAddress}:`)
    ? memo.split(`:${affiliateAddress}:`)[0]
    : memo;

  return removedAffiliate?.substring(0, removedAffiliate.lastIndexOf(":"));
}

// function recursivelyOrderKeys(unordered: any) {
//   // If it's an array - recursively order any
//   // dictionary items within the array
//   if (Array.isArray(unordered)) {
//     unordered.forEach((item, index) => {
//       unordered[index] = recursivelyOrderKeys(item);
//     });
//     return unordered;
//   }

//   // If it's an object - let's order the keys
//   if (typeof unordered !== "object") return unordered;
//   const ordered: any = {};
//   const sortedKeys = Object.keys(unordered).sort();

//   for (const key of sortedKeys) {
//     ordered[key] = recursivelyOrderKeys(unordered[key]);
//   }

//   return ordered;
// }

// function stringifyKeysInOrder(data: any) {
//   return JSON.stringify(recursivelyOrderKeys(data));
// }

async function getWalletMethods({
  chain,
  derivationPath,
}: { chain: Chain; derivationPath?: DerivationPathArray }) {
  switch (chain) {
    case Chain.BitcoinCash:
    case Chain.Bitcoin:
    case Chain.Dash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/utxo");
      const getToolbox = await getToolboxByChain(chain);
      const toolbox = getToolbox();

      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });

      const transfer = async (params: UTXOBuildTxParams) => {
        const feeRate = params.feeRate || (await toolbox.getFeeRates())[FeeOption.Average];
        const memo = [Chain.Bitcoin].includes(chain) ? params.memo : reduceMemo(params.memo);

        const { psbt, inputs } = await toolbox.buildTx({
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
    case Chain.Base: {
      const { getToolboxByChain, getProvider } = await import("@swapkit/toolboxes/evm");
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });
      const provider = getProvider(chain);
      const toolbox = getToolboxByChain(chain)({ signer, provider });

      return { ...toolbox, address };
    }

    case Chain.Cosmos:
    case Chain.THORChain: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/cosmos");
      const signer = await getLedgerClient({ chain, derivationPath });
      const address = await getLedgerAddress({ chain, ledgerClient: signer });
      const toolbox = getToolboxByChain(chain)(signer);
      return { ...toolbox, address };
    }

    // case Chain.THORChain: {
    //   const { SignMode } = await import("cosmjs-types/cosmos/tx/signing/v1beta1/signing.js");
    //   const { TxRaw } = await import("cosmjs-types/cosmos/tx/v1beta1/tx.js");
    //   const { encodePubkey, makeAuthInfoBytes } = await import("@cosmjs/proto-signing");
    //   const {
    //     createStargateClient,
    //     buildEncodedTxBody,
    //     ThorchainToolbox,
    //     buildAminoMsg,
    //     getDefaultChainFee,
    //     fromBase64,
    //     parseAminoMessageForDirectSigning,
    //   } = await import("@swapkit/toolboxes/cosmos");
    //   const signer = await getLedgerClient({ chain, derivationPath });
    //   const address = await getLedgerAddress({ chain, ledgerClient: signer });
    //   const toolbox = ThorchainToolbox(signer);

    //   const fee = getDefaultChainFee(chain);
    //   const { pubkey: value, signTransaction, sign: signMessage } = signer;

    //   // ANCHOR (@Chillios): Same parts in methods + can extract StargateClient init to toolbox
    //   const thorchainTransfer = async ({
    //     memo = "",
    //     assetValue,
    //     ...rest
    //     // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Refactor to reduce complexity
    //   }: TransferParams | DepositParam) => {
    //     const account = await toolbox.getAccount(address);
    //     if (!account) throw new Error("invalid account");
    //     if (!assetValue) throw new Error("invalid asset");
    //     if (!value) throw new Error("Account pubkey not found");

    //     const { accountNumber, sequence: sequenceNumber } = account;
    //     const sequence = (sequenceNumber || 0).toString();

    //     const orderedMessages = recursivelyOrderKeys([
    //       buildAminoMsg({ chain, from: address, assetValue, memo, ...rest }),
    //     ]);

    //     // get tx signing msg
    //     const rawSendTx = stringifyKeysInOrder({
    //       account_number: accountNumber?.toString(),
    //       chain_id: ChainId.THORChain,
    //       fee,
    //       memo,
    //       msgs: orderedMessages,
    //       sequence,
    //     });

    //     const signatures = await signTransaction(rawSendTx, sequence);
    //     if (!signatures) throw new Error("tx signing failed");

    //     const pubkey = encodePubkey({ type: "tendermint/PubKeySecp256k1", value });
    //     const msgs = orderedMessages.map(parseAminoMessageForDirectSigning);
    //     const bodyBytes = await buildEncodedTxBody({ msgs, chain, memo });

    //     const authInfoBytes = makeAuthInfoBytes(
    //       [{ pubkey, sequence: Number(sequence) }],
    //       fee.amount,
    //       Number.parseInt(fee.gas),
    //       undefined,
    //       undefined,
    //       SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
    //     );

    //     const signature = signatures?.[0]?.signature
    //       ? fromBase64(signatures[0].signature)
    //       : Uint8Array.from([]);

    //     const txRaw = TxRaw.fromPartial({ bodyBytes, authInfoBytes, signatures: [signature] });
    //     const txBytes = TxRaw.encode(txRaw).finish();
    //     const { isStagenet } = SKConfig.get("envs");

    //     const broadcaster = await createStargateClient(
    //       SKConfig.get("rpcUrls")[isStagenet ? StagenetChain.THORChain : Chain.THORChain],
    //     );
    //     const { transactionHash } = await broadcaster.broadcastTx(txBytes);

    //     return transactionHash;
    //   };

    //   const transfer = (params: TransferParams) => thorchainTransfer(params);
    //   const deposit = (params: DepositParam) => thorchainTransfer(params);

    //   return { ...toolbox, address, deposit, transfer, signMessage };
    // }

    default:
      throw new Error("Unsupported chain");
  }
}
