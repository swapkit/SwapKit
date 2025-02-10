import {
  type FungibleResourcesCollectionItem,
  GatewayApiClient,
  type StateEntityDetailsVaultResponseItem,
  type StateEntityFungiblesPageRequest,
  type StateEntityFungiblesPageResponse,
} from "@radixdlt/babylon-gateway-api-sdk";
import { RadixDappToolkit } from "@radixdlt/radix-dapp-toolkit";
import { AssetValue, Chain, type SKConfigIntegrations } from "@swapkit/helpers";

// import {
//   Convert,
//   type Instructions,
//   type Intent,
//   LTSRadixEngineToolkit,
//   ManifestBuilder,
//   type Message,
//   type NotarizedTransaction,
//   PrivateKey,
//   type PublicKey,
//   RadixEngineToolkit,
//   type Signature,
//   type SignatureWithPublicKey,
//   TransactionBuilder,
//   type TransactionManifest,
//   address,
//   bucket,
//   decimal,
//   enumeration,
//   generateRandomNonce,
// } from "@radixdlt/radix-engine-toolkit";

type RadixGetBalanceParams = {
  address: string;
  networkApi: GatewayApiClient;
};
// #endregion

// async function fetchNFTBalances(address: string): Promise<Balance[]> {
//   const nonFungibleResources = await this.fetchNonFungibleResources(address);
//   const nonFungibleBalances = this.convertResourcesToBalances(nonFungibleResources);
//   return nonFungibleBalances;
// }

// async function fetchNonFungibleResources(
//   address: string,
// ): Promise<NonFungibleResourcesCollectionItem[]> {
//   let hasNextPage = true;
//   let nextCursor = undefined;
//   const stateVersion = await currentStateVersion();
//   let nonFungibleResources: NonFungibleResourcesCollectionItem[] = [];

//   while (hasNextPage) {
//     const stateEntityNonFungiblesPageRequest: StateEntityNonFungiblesPageRequest = {
//       address: address,
//       limit_per_page: 5,
//       cursor: nextCursor,
//       at_ledger_state: {
//         state_version: stateVersion,
//       },
//     };

//     const stateEntityNonFungiblesPageResponse: StateEntityNonFungiblesPageResponse =
//       await gatewayClient.state.innerClient.entityNonFungiblesPage({
//         stateEntityNonFungiblesPageRequest: stateEntityNonFungiblesPageRequest,
//       });
//     nonFungibleResources = nonFungibleResources.concat(stateEntityNonFungiblesPageResponse.items);
//     if (stateEntityNonFungiblesPageResponse.next_cursor) {
//       nextCursor = stateEntityNonFungiblesPageResponse.next_cursor;
//     } else {
//       hasNextPage = false;
//     }
//   }
//   return nonFungibleResources;
// }

// #endregion Public Methods

// #region Private Methods
// function createGatewayClient(network: number): GatewayApiClient {
//   const applicationName = "xchainjs";
//   return GatewayApiClient.initialize({
//     networkId: network,
//     applicationName,
//   });
// }

// async function previewIntent({
//   intent,
//   network,
//   networkApi,
// }: {
//   intent: Intent;
//   network: RadixNetwork;
//   networkApi: GatewayApiClient;
// }): Promise<TransactionPreviewResponse> {
//   // Translate the RET models to the gateway models for preview.
//   const request: TransactionPreviewOperationRequest = {
//     transactionPreviewRequest: {
//       manifest: await RadixEngineToolkit.Instructions.convert(
//         intent.manifest.instructions,
//         network.networkId,
//         "String",
//       ).then((instructions) => instructions.value as string),
//       blobs_hex: [],
//       start_epoch_inclusive: intent.header.startEpochInclusive,
//       end_epoch_exclusive: intent.header.endEpochExclusive,
//       notary_public_key: retPublicKeyToGatewayPublicKey(intent.header.notaryPublicKey),
//       notary_is_signatory: intent.header.notaryIsSignatory,
//       tip_percentage: intent.header.tipPercentage,
//       nonce: intent.header.nonce,
//       signer_public_keys: [retPublicKeyToGatewayPublicKey(intent.header.notaryPublicKey)],
//       // TODO: Add message
//       flags: {
//         assume_all_signature_proofs: false,
//         skip_epoch_check: false,
//         use_free_credit: false,
//       },
//     },
//   };

//   return networkApi.transaction.innerClient.transactionPreview(request);
// }

// function retPublicKeyToGatewayPublicKey(publicKey: PublicKey): GatewayPublicKey {
//   switch (publicKey.curve) {
//     case "Secp256k1":
//       return {
//         key_type: "EcdsaSecp256k1",
//         key_hex: publicKey.hex(),
//       };
//     case "Ed25519":
//       return {
//         key_type: "EddsaEd25519",
//         key_hex: publicKey.hex(),
//       };
//   }
// }

// export type RadixSigner = {
//   getAddress?: () => Promise<string>;
//   publicKey(): PublicKey;
//   publicKeyBytes(): Uint8Array;
//   publicKeyHex(): string;
//   sign(messageHash: Uint8Array): Uint8Array;
//   signToSignature(messageHash: Uint8Array): Signature;
//   signToSignatureWithPublicKey(messageHash: Uint8Array): SignatureWithPublicKey;
// };

// export async function createPrivateKey(phrase: string) {
//   const seed = await mnemonicToSeed(phrase);

//   return new PrivateKey.Ed25519(seed.slice(0, 32));
// }

// function getAddress(signer: RadixSigner, network: RadixNetwork) {
//   return LTSRadixEngineToolkit.Derive.virtualAccountAddress(signer.publicKey(), network.networkId);
// }

// Could not find anything sync in SDK, ask Radix team
export function validateAddress(address: string) {
  return address.startsWith("account_rdx1") && address.length === 66;
}

function getBalance({ networkApi }: { networkApi: GatewayApiClient }) {
  return async function getBalance(address: string) {
    const fungibleResources = await fetchFungibleResources({ address, networkApi });
    const fungibleBalances = convertResourcesToBalances({
      resources: fungibleResources,
      networkApi,
    });
    return fungibleBalances;
  };
}

async function fetchFungibleResources({
  address,
  networkApi,
}: RadixGetBalanceParams): Promise<FungibleResourcesCollectionItem[]> {
  let hasNextPage = true;
  let nextCursor = undefined;
  let fungibleResources: FungibleResourcesCollectionItem[] = [];
  const stateVersion = await currentStateVersion(networkApi);
  while (hasNextPage) {
    const stateEntityFungiblesPageRequest: StateEntityFungiblesPageRequest = {
      address: address,
      limit_per_page: 100,
      cursor: nextCursor,
      at_ledger_state: {
        state_version: stateVersion,
      },
    };

    const stateEntityFungiblesPageResponse: StateEntityFungiblesPageResponse =
      await networkApi.state.innerClient.entityFungiblesPage({
        stateEntityFungiblesPageRequest: stateEntityFungiblesPageRequest,
      });

    fungibleResources = fungibleResources.concat(stateEntityFungiblesPageResponse.items);
    if (stateEntityFungiblesPageResponse.next_cursor) {
      nextCursor = stateEntityFungiblesPageResponse.next_cursor;
    } else {
      hasNextPage = false;
    }
  }
  return fungibleResources;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
async function convertResourcesToBalances({
  resources,
  networkApi,
}: {
  resources: FungibleResourcesCollectionItem[]; //| NonFungibleResourcesCollectionItem[];
  networkApi: GatewayApiClient;
}): Promise<AssetValue[]> {
  const balances: AssetValue[] = [];
  const BATCH_SIZE = 50;

  // Split resources into batches of up to 50 items
  const resourceBatches = [];
  for (let i = 0; i < resources.length; i += BATCH_SIZE) {
    resourceBatches.push(resources.slice(i, i + BATCH_SIZE));
  }

  for (const batch of resourceBatches) {
    const addresses = batch.map((item) => item.resource_address);
    const response: StateEntityDetailsVaultResponseItem[] =
      await networkApi.state.getEntityDetailsVaultAggregated(addresses);

    const divisibilities = new Map<string, { decimals: number; symbol: string }>();

    for (const result of response) {
      if (result.details !== undefined) {
        const metaDataSymbol = result.metadata?.items.find((item) => item.key === "symbol");
        const symbol =
          metaDataSymbol?.value.typed.type === "String" ? metaDataSymbol.value.typed.value : "?";

        if (result.details.type === "FungibleResource") {
          divisibilities.set(result.address, {
            decimals: result.details.divisibility,
            symbol,
          });
        }
      }
    }

    for (const item of batch) {
      if (item.aggregation_level === "Global") {
        const assetInfo = divisibilities.get(item.resource_address) || { decimals: 0, symbol: "?" };

        const balance = AssetValue.from({
          asset:
            assetInfo.symbol !== Chain.Radix
              ? `${Chain.Radix}.${assetInfo.symbol}-${item.resource_address}`
              : "XRD.XRD",
          value: item.amount,
        });
        balances.push(balance);
      }
    }
  }
  // Iterate through resources
  return balances;
}

// function getCurrentEpoch(networkApi: GatewayApiClient) {
//   return networkApi.status.getCurrent().then((status) => status.ledger_state.epoch);
// }

async function currentStateVersion(networkApi: GatewayApiClient) {
  return networkApi.status.getCurrent().then((status) => status.ledger_state.state_version);
}

// function constructSimpleTransferIntent({
//   networkApi,
//   network = RadixMainnet,
// }: {
//   networkApi: GatewayApiClient;
//   network: RadixNetwork;
// }) {
//   // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
//   return async function constructSimpleTransferIntent(
//     params:
//       | {
//           from: string;
//           recipient: string;
//           assetValue: AssetValue;
//           notaryPublicKey: PublicKey;
//           memo: string;
//         }
//       | { manifest: string | TransactionManifest; notaryPublicKey: PublicKey },
//   ): Promise<{ intent: Intent; fees: number }> {
//     const nonce = generateRandomNonce();

//     const { notaryPublicKey } = params;

//     const from = "from" in params ? params.from : undefined;
//     const recipient = "recipient" in params ? params.recipient : undefined;
//     const assetValue = "assetValue" in params ? params.assetValue : undefined;
//     const memo = "memo" in params ? params.memo : undefined;
//     // Construct the intent with a random fee lock, say 5 XRD and then create a transaction intent
//     // from it.

//     const manifestWithHardcodedFee =
//       "manifest" in params
//         ? typeof params.manifest === "string"
//           ? ({
//               instructions: await convertManifestToInstructions({ network })(params.manifest),
//               blobs: [],
//             } as TransactionManifest)
//           : params.manifest
//         : from && recipient && assetValue
//           ? simpleTransferManifest({
//               from,
//               recipient,
//               assetValue,
//               fees: AssetValue.from({
//                 asset: "XRD.XRD",
//                 value: "5",
//               }),
//             })
//           : undefined;

//     if (!manifestWithHardcodedFee) {
//       throw new Error("Manifest is required");
//     }

//     const intentWithHardcodedFee = await constructIntent({
//       manifest: manifestWithHardcodedFee,
//       message: memo
//         ? {
//             kind: "PlainText",
//             value: { mimeType: "text/plain", message: { kind: "String", value: memo } },
//           }
//         : { kind: "None" },
//       nonce,
//       notaryPublicKey,
//       networkApi,
//       network,
//     });

//     const previewReceipt = await previewIntent({
//       intent: intentWithHardcodedFee,
//       network,
//       networkApi,
//     });
//     // Ensure that the preview was successful.
//     // @ts-expect-error
//     if (previewReceipt.receipt.status !== "Succeeded") {
//       throw new Error("Preview for fees was not successful");
//     }

//     // Calculate the total fees
//     const totalFees = [
//       // @ts-expect-error
//       previewReceipt.receipt.fee_summary.xrd_total_execution_cost,
//       // @ts-expect-error
//       previewReceipt.receipt.fee_summary.xrd_total_finalization_cost,
//       // @ts-expect-error
//       previewReceipt.receipt.fee_summary.xrd_total_royalty_cost,
//       // @ts-expect-error
//       previewReceipt.receipt.fee_summary.xrd_total_storage_cost,
//       // @ts-expect-error
//       previewReceipt.receipt.fee_summary.xrd_total_tipping_cost,
//     ]
//       .map(Number.parseFloat)
//       .reduce((acc, item) => acc + item, 0);

//     // We need to add another 10% to the fees as the preview response does not include everything needed
//     // to actually submit the transaction, ie: signature validation

//     // Construct a new intent with the calculated fees.
//     const manifest =
//       "manifest" in params
//         ? typeof params.manifest === "string"
//           ? ({
//               instructions: await convertManifestToInstructions({ network })(params.manifest),
//               blobs: [],
//             } as TransactionManifest)
//           : params.manifest
//         : from && recipient && assetValue
//           ? simpleTransferManifest({
//               from,
//               recipient,
//               assetValue,
//               fees: new SwapKitNumber(totalFees).mul(1.1),
//             })
//           : undefined;

//     if (!manifest) {
//       throw new Error("Manifest is required");
//     }

//     const intent = await constructIntent({
//       manifest,
//       message: memo
//         ? {
//             kind: "PlainText",
//             value: {
//               mimeType: "text/plain",
//               message: { kind: "String", value: memo },
//             },
//           }
//         : { kind: "None" },
//       nonce,
//       notaryPublicKey,
//       network,
//       networkApi,
//     });

//     return {
//       intent,
//       fees: totalFees,
//     };
//   };
// }

// function simpleTransferManifest({
//   from,
//   recipient,
//   assetValue,
//   fees,
// }: {
//   from: string;
//   recipient: string;
//   assetValue: AssetValue;
//   fees: SwapKitNumber;
// }): TransactionManifest {
//   if (assetValue.address === undefined) {
//     throw new Error("Asset value must have an address");
//   }

//   return new ManifestBuilder()
//     .callMethod(from, "lock_fee", [decimal(fees.getValue("string"))])
//     .callMethod(from, "withdraw", [
//       address(assetValue.address),
//       decimal(assetValue.getValue("string")),
//     ])
//     .takeFromWorktop(
//       assetValue.address,
//       decimal(assetValue.getValue("string")).value,
//       (builder, bucketId) => {
//         return builder.callMethod(recipient, "try_deposit_or_abort", [
//           bucket(bucketId),
//           enumeration(0),
//         ]);
//       },
//     )
//     .build();
// }

// async function constructIntent({
//   manifest,
//   message,
//   nonce,
//   notaryPublicKey,
//   networkApi,
//   network,
// }: {
//   manifest: TransactionManifest;
//   message: Message;
//   nonce: number;
//   notaryPublicKey: PublicKey;
//   networkApi: GatewayApiClient;
//   network: RadixNetwork;
// }): Promise<Intent> {
//   const epoch = await getCurrentEpoch(networkApi);
//   return {
//     header: {
//       networkId: network.networkId,
//       startEpochInclusive: epoch,
//       endEpochExclusive: epoch + 10,
//       nonce,
//       notaryPublicKey,
//       notaryIsSignatory: true,
//       tipPercentage: 0,
//     },
//     manifest,
//     message,
//   };
// }

// function transfer({
//   signer,
//   networkApi,
//   network = RadixMainnet,
// }: {
//   signer?: RadixSigner;
//   networkApi: GatewayApiClient;
//   network?: RadixNetwork;
// }) {
//   return async function transfer({
//     assetValue: unsafeAssetValue,
//     from,
//     recipient,
//     memo = "",
//   }: { assetValue: AssetValue; from: string; recipient: string; memo?: string }) {
//     if (!signer) throw new SwapKitError("toolbox_radix_signer_not_defined");

//     const assetValue =
//       unsafeAssetValue.toString() === "XRD.XRD"
//         ? AssetValue.from({
//             asset: "XRD.XRD-resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd",
//             value: unsafeAssetValue.getValue("string"),
//           })
//         : unsafeAssetValue;

//     if (!assetValue.address) throw new Error("Asset value must have an address");

//     const publicKey = signer.publicKey();
//     const intent = (
//       await constructSimpleTransferIntent({
//         network,
//         networkApi,
//       })({ from, recipient, assetValue, memo, notaryPublicKey: publicKey })
//     ).intent;

//     const compiledIntent = await RadixEngineToolkit.Intent.compile(intent);

//     const notarySignature = signer.signToSignature(compiledIntent);

//     const notarizedTransaction = await TransactionBuilder.new().then((builder) => {
//       return builder
//         .header(intent.header)
//         .message(intent.message)
//         .manifest(intent.manifest)
//         .notarize(notarySignature);
//     });

//     const notarizedTransactionBytes =
//       await RadixEngineToolkit.NotarizedTransaction.compile(notarizedTransaction);
//     const hash = await broadcastTransaction({
//       networkApi,
//     })(Convert.Uint8Array.toHexString(notarizedTransactionBytes));
//     return hash;
//   };

//     const constructionMetadata = await net.LTS.getConstructionMetadata();
//     const builder = await SimpleTransactionBuilder.new({
//       networkId: network.networkId,
//       validFromEpoch: constructionMetadata.current_epoch,
//       fromAccount: from,
//       signerPublicKey: signer.publicKey(),
//     });

//     const unsignedTransaction = builder
//       .transferFungible({
//         toAccount: recipient,
//         resourceAddress: assetValue.address,
//         amount: assetValue.getBaseValue("number"),
//       })
//       .compileIntent();

//     const intentHashTransactionId = notarizedTransaction.transactionId.id;

//     try {
//       await api.LTS.submitTransaction({
//         notarized_transaction_hex: notarizedTransaction.toHex(),
//       });
//     } catch (error) {
//       throw new Error(`Failed to submit transaction: ${error}`);
//     }

//     return intentHashTransactionId;
//   };
// }

// function broadcastTransaction({
//   networkApi,
// }: {
//   networkApi: GatewayApiClient;
// }) {
//   return async function broadcastTransaction(tx: NotarizedTransaction | string) {
//     const txToBroadcast: NotarizedTransaction =
//       typeof tx === "string"
//         ? await RadixEngineToolkit.NotarizedTransaction.decompile(
//             Convert.HexString.toUint8Array(tx),
//           )
//         : tx;
//     const intentHash = await RadixEngineToolkit.NotarizedTransaction.intentHash(txToBroadcast);
//     const transactionHex = await RadixEngineToolkit.NotarizedTransaction.compile(
//       txToBroadcast,
//     ).then(Convert.Uint8Array.toHexString);
//     await networkApi.transaction.innerClient.transactionSubmit({
//       transactionSubmitRequest: { notarized_transaction_hex: transactionHex },
//     });

//     return intentHash.id;
//   };
// }

// export function convertManifestToInstructions({ network }: { network: RadixNetwork }) {
//   return function convertManifestToInstructions(transactionManifest: string) {
//     return RadixEngineToolkit.Instructions.convert(
//       {
//         kind: "String",
//         value: transactionManifest,
//       },
//       network.networkId,
//       "Parsed",
//     );
//   };
// }

// export function convertInstructionsToManifest({ network }: { network: RadixNetwork }) {
//   return function convertInstructionsToManifest(transactionManifest: Instructions) {
//     return RadixEngineToolkit.Instructions.convert(
//       transactionManifest,
//       network.networkId,
//       "String",
//     );
//   };
// }

// function signAndBroadcast({
//   signer,
//   networkApi,
//   network = RadixMainnet,
// }: {
//   signer?: RadixSigner;
//   networkApi: GatewayApiClient;
//   network?: RadixNetwork;
// }) {
//   return async function signAndBroadcast({ manifest }: { manifest: string | TransactionManifest }) {
//     if (!signer) throw new SwapKitError("toolbox_radix_signer_not_defined");
//     const publicKey = signer.publicKey();
//     const intent = (
//       await constructSimpleTransferIntent({
//         network,
//         networkApi,
//       })({ manifest, notaryPublicKey: publicKey })
//     ).intent;

//     const compiledIntent = await RadixEngineToolkit.Intent.compile(intent);

//     const notarySignature = signer.signToSignature(compiledIntent);

//     const notarizedTransaction = await TransactionBuilder.new().then((builder) => {
//       return builder
//         .header(intent.header)
//         .message(intent.message)
//         .manifest(intent.manifest)
//         .notarize(notarySignature);
//     });

//     const notarizedTransactionBytes =
//       await RadixEngineToolkit.NotarizedTransaction.compile(notarizedTransaction);
//     const transactionId = await broadcastTransaction({
//       networkApi,
//     })(Convert.Uint8Array.toHexString(notarizedTransactionBytes));
//     return transactionId;
//   };
// }

export const RadixToolbox = async ({
  dappConfig,
}: { dappConfig: SKConfigIntegrations["radix"] }) => {
  const radixToolkit = RadixDappToolkit({
    ...dappConfig,
    networkId: dappConfig.network?.networkId || 1,
  });

  const networkApi = GatewayApiClient.initialize(radixToolkit.gatewayApi.clientConfig);

  return {
    networkApi,
    getBalance: getBalance({ networkApi }),
    getAddress: () => {
      return "";
    },
    validateAddress,
    signAndBroadcast: (() => {
      throw new Error("Not implemented");
    }) as (params: any) => Promise<string>,
  };
};

// function signMessage(_signer?: RadixSigner) {
//   return function signMessage(_message: string) {
//     throw new SwapKitError("not_implemented", { method: "signMessage", toolbox: "radix" });

//     // TODO: convert message to Uint8Array
//     // return signer.signToSignatureWithPublicKey(message);
//   };
// }

// function validateSignature(_signer?: RadixSigner) {
//   return function validateSignature(_signature: SignatureWithPublicKey) {
//     throw new SwapKitError("not_implemented", { method: "validateSignature", toolbox: "radix" });

//     // TODO: validate signature
//     // return
//   };
// }
