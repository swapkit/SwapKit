import {
  AssetValue,
  BaseDecimal,
  Chain,
  DerivationPath,
  type DerivationPathArray,
  type GenericCreateTransactionParams,
  NetworkDerivationPath,
  SKConfig,
  SwapKitError,
  SwapKitNumber,
  derivationPathToString,
  updateDerivationPath,
} from "@swapkit/helpers";
import { P, match } from "ts-pattern";
import { getBalance } from "../utils";
import type {
  CardanoCreateTransactionParams,
  CardanoKeypair,
  CardanoNetwork,
  CardanoProvider,
  CardanoTransaction,
  CardanoTransferParams,
} from "./types";

type CardanoSigner = CardanoProvider | CardanoKeypair;

export async function getCardanoAddressValidator() {
  try {
    const CardanoWasm = await import("@emurgo/cardano-serialization-lib-nodejs");
    
    return (address: string) => {
      try {
        CardanoWasm.Address.from_bech32(address);
        return true;
      } catch {
        try {
          CardanoWasm.ByronAddress.from_base58(address);
          return true;
        } catch {
          return false;
        }
      }
    };
  } catch (error) {
    // Fallback validator using basic validation
    return (address: string) => {
      // Basic Cardano address validation
      const cardanoRegex = /^(addr1|addr_test1|DdzFF|Ae2)[a-zA-Z0-9]+$/;
      return cardanoRegex.test(address) && address.length >= 50 && address.length <= 110;
    };
  }
}

export async function getCardanoToolbox(
  toolboxParams?:
    | { signer?: CardanoSigner }
    | { phrase?: string; index?: number; derivationPath?: DerivationPathArray; network?: CardanoNetwork },
) {
  const network: CardanoNetwork = 
    toolboxParams && "network" in toolboxParams 
      ? toolboxParams.network || "mainnet" 
      : "mainnet";
  
  const index = toolboxParams && "index" in toolboxParams ? toolboxParams.index || 0 : 0;
  const derivationPath = derivationPathToString(
    toolboxParams && "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[Chain.Cardano], { index }),
  );

  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, ({ phrase }) => createKeysForPath({ phrase, derivationPath, network }))
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  function getAddress() {
    if (!signer) return "";
    if ("address" in signer) return signer.address;
    // For provider, we'd need to get address from the provider
    return "";
  }

  return {
    network,
    getAddress,
    createKeysForPath,
    getAddressValidator: getCardanoAddressValidator,
    createTransaction: createTransaction(network),
    getBalance: getBalance(Chain.Cardano),
    transfer: transfer(signer, network),
    broadcastTransaction: broadcastTransaction(network),
    signTransaction: signTransaction(signer),
    estimateTransactionFee: estimateTransactionFee(network),
    validateAddress: await getCardanoAddressValidator(),
  };
}

function estimateTransactionFee(network: CardanoNetwork) {
  return async ({
    recipient,
    assetValue,
    memo,
    sender,
    ttl,
  }: Omit<GenericCreateTransactionParams, "feeRate"> & {
    ttl?: number;
  }) => {
    try {
      const CardanoWasm = await import("@emurgo/cardano-serialization-lib-nodejs");
      
      // Create a dummy transaction to estimate fee
      const txBuilder = CardanoWasm.TransactionBuilder.new(
        getLinearFeeConfig(),
        CardanoWasm.BigNum.from_str("1000000"), // min utxo
        CardanoWasm.BigNum.from_str("500000000"), // pool deposit
        CardanoWasm.BigNum.from_str("2000000") // key deposit
      );

      // Add dummy input
      const dummyTxHash = CardanoWasm.TransactionHash.from_bytes(new Uint8Array(32).fill(0));
      const dummyInput = CardanoWasm.TransactionInput.new(dummyTxHash, 0);
      
      // Create dummy output value
      const outputValue = CardanoWasm.Value.new(
        CardanoWasm.BigNum.from_str(assetValue.getBaseValue("string"))
      );

      // Add dummy output
      const outputAddress = CardanoWasm.Address.from_bech32(recipient);
      const output = CardanoWasm.TransactionOutput.new(outputAddress, outputValue);
      
      txBuilder.add_output(output);
      
      // Set TTL if provided
      if (ttl) {
        txBuilder.set_ttl(ttl);
      }

      // Calculate fee
      const fee = txBuilder.min_fee();
      
      return AssetValue.from({
        chain: Chain.Cardano,
        value: SwapKitNumber.fromBigInt(BigInt(fee.to_str()), BaseDecimal[Chain.Cardano]),
      });
    } catch (error) {
      // Fallback fee estimation
      return AssetValue.from({
        chain: Chain.Cardano,
        value: SwapKitNumber.fromBigInt(BigInt("170000"), BaseDecimal[Chain.Cardano]), // ~0.17 ADA typical fee
      });
    }
  };
}

function getLinearFeeConfig() {
  const CardanoWasm = require("@emurgo/cardano-serialization-lib-nodejs");
  return CardanoWasm.LinearFee.new(
    CardanoWasm.BigNum.from_str("44"), // coefficient
    CardanoWasm.BigNum.from_str("155381") // constant
  );
}

async function getBlockfrostClient(network: CardanoNetwork) {
  const rpcUrls = SKConfig.get("rpcUrls");
  const apiKey = rpcUrls[`${Chain.Cardano}_API_KEY`] || rpcUrls[`CARDANO_API_KEY`];
  
  if (!apiKey) {
    throw new SwapKitError({
      errorKey: "toolbox_cardano_api_key_not_configured",
      info: { network },
    });
  }

  const baseUrl = network === "mainnet" 
    ? "https://cardano-mainnet.blockfrost.io/api/v0"
    : `https://cardano-${network}.blockfrost.io/api/v0`;

  return {
    apiKey,
    baseUrl,
    async request(endpoint: string, options: RequestInit = {}) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'project_id': apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new SwapKitError({
          errorKey: "toolbox_cardano_api_request_failed",
          info: { status: response.status, endpoint },
        });
      }

      return response.json();
    }
  };
}

function createTransaction(network: CardanoNetwork) {
  return async ({
    recipient,
    assetValue,
    memo,
    sender,
    ttl,
  }: CardanoCreateTransactionParams): Promise<CardanoTransaction> => {
    const validateAddress = await getCardanoAddressValidator();
    
    if (!validateAddress(recipient)) {
      throw new SwapKitError({ errorKey: "core_transaction_invalid_recipient_address" });
    }

    if (!sender) {
      throw new SwapKitError({ errorKey: "core_transaction_invalid_sender_address" });
    }

    if (!assetValue.isGasAsset || assetValue.chain !== Chain.Cardano) {
      throw new SwapKitError({
        errorKey: "toolbox_cardano_asset_not_supported",
        info: { asset: assetValue.toString() },
      });
    }

    try {
      const CardanoWasm = await import("@emurgo/cardano-serialization-lib-nodejs");
      const blockfrost = await getBlockfrostClient(network);

      // Get UTXOs for the sender
      const utxosResponse = await blockfrost.request(`/addresses/${sender}/utxos`);
      
      if (!utxosResponse || utxosResponse.length === 0) {
        throw new SwapKitError({ errorKey: "toolbox_cardano_insufficient_utxos" });
      }

      // Create transaction builder
      const txBuilder = CardanoWasm.TransactionBuilder.new(
        getLinearFeeConfig(),
        CardanoWasm.BigNum.from_str("1000000"), // min utxo
        CardanoWasm.BigNum.from_str("500000000"), // pool deposit
        CardanoWasm.BigNum.from_str("2000000") // key deposit
      );

      // Add inputs
      let totalInput = BigInt(0);
      const neededAmount = BigInt(assetValue.getBaseValue("string"));
      
      for (const utxo of utxosResponse) {
        if (totalInput >= neededAmount + BigInt("2000000")) break; // Include some buffer for fees
        
        const txHash = CardanoWasm.TransactionHash.from_bytes(
          Buffer.from(utxo.tx_hash, 'hex')
        );
        const input = CardanoWasm.TransactionInput.new(txHash, utxo.output_index);
        
        const value = CardanoWasm.Value.new(
          CardanoWasm.BigNum.from_str(utxo.amount.find((a: any) => a.unit === 'lovelace')?.quantity || '0')
        );
        
        txBuilder.add_key_input(
          CardanoWasm.hash_blake2b256(new Uint8Array(32)), // dummy key hash
          input,
          value
        );
        
        totalInput += BigInt(utxo.amount.find((a: any) => a.unit === 'lovelace')?.quantity || '0');
      }

      // Add output
      const outputAddress = CardanoWasm.Address.from_bech32(recipient);
      const outputValue = CardanoWasm.Value.new(
        CardanoWasm.BigNum.from_str(assetValue.getBaseValue("string"))
      );
      const output = CardanoWasm.TransactionOutput.new(outputAddress, outputValue);
      txBuilder.add_output(output);

      // Add change output if needed
      const fee = BigInt("170000"); // Estimate
      const change = totalInput - neededAmount - fee;
      if (change > BigInt("1000000")) { // Min UTXO threshold
        const changeAddress = CardanoWasm.Address.from_bech32(sender);
        const changeValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(change.toString()));
        const changeOutput = CardanoWasm.TransactionOutput.new(changeAddress, changeValue);
        txBuilder.add_output(changeOutput);
      }

      // Set TTL
      if (ttl) {
        txBuilder.set_ttl(ttl);
      } else {
        // Get current slot and add reasonable TTL
        const latestBlock = await blockfrost.request('/blocks/latest');
        txBuilder.set_ttl(latestBlock.slot + 3600); // 1 hour from now
      }

      // Add metadata for memo if provided
      if (memo) {
        const metadata = CardanoWasm.GeneralTransactionMetadata.new();
        const metadataValue = CardanoWasm.TransactionMetadatum.new_text(memo);
        metadata.insert(CardanoWasm.BigNum.from_str("674"), metadataValue);
        
        const auxData = CardanoWasm.AuxiliaryData.new();
        auxData.set_metadata(metadata);
        txBuilder.set_auxiliary_data(auxData);
      }

      // Build the transaction
      const txBody = txBuilder.build();
      const witnessSet = CardanoWasm.TransactionWitnessSet.new();
      
      const transaction = CardanoWasm.Transaction.new(
        txBody,
        witnessSet,
        txBuilder.get_auxiliary_data()
      );

      return {
        body: Buffer.from(txBody.to_bytes()).toString('hex'),
        witnessSet: Buffer.from(witnessSet.to_bytes()).toString('hex'),
        auxiliaryData: txBuilder.get_auxiliary_data() 
          ? Buffer.from(txBuilder.get_auxiliary_data()!.to_bytes()).toString('hex')
          : undefined,
      };
    } catch (error) {
      throw new SwapKitError({
        errorKey: "toolbox_cardano_create_transaction_error",
        info: { error: error.message },
      });
    }
  };
}

function transfer(signer?: CardanoSigner, network: CardanoNetwork = "mainnet") {
  return async ({ recipient, assetValue, memo, ttl }: CardanoTransferParams) => {
    if (!signer) {
      throw new SwapKitError({ errorKey: "toolbox_cardano_signer_not_found" });
    }

    const sender = "address" in signer ? signer.address : await getProviderAddress(signer);
    
    const transaction = await createTransaction(network)({
      recipient,
      assetValue,
      memo,
      sender,
      ttl,
    });

    const signedTx = await signTransaction(signer)(transaction);
    return broadcastTransaction(network)(signedTx);
  };
}

async function getProviderAddress(provider: CardanoProvider): Promise<string> {
  try {
    const addresses = await provider.getUsedAddresses();
    if (addresses.length > 0) {
      return addresses[0].address;
    }
    
    const unusedAddresses = await provider.getUnusedAddresses();
    if (unusedAddresses.length > 0) {
      return unusedAddresses[0].address;
    }
    
    throw new SwapKitError({ errorKey: "toolbox_cardano_no_addresses_found" });
  } catch (error) {
    throw new SwapKitError({
      errorKey: "toolbox_cardano_get_address_error",
      info: { error: error.message },
    });
  }
}

function signTransaction(signer?: CardanoSigner) {
  return async (transaction: CardanoTransaction): Promise<string> => {
    if (!signer) {
      throw new SwapKitError({ errorKey: "toolbox_cardano_signer_not_found" });
    }

    try {
      if ("signTx" in signer) {
        // Provider signing
        const txHex = transaction.body + transaction.witnessSet + (transaction.auxiliaryData || "");
        return await signer.signTx(txHex);
      } else {
        // Keypair signing
        const CardanoWasm = await import("@emurgo/cardano-serialization-lib-nodejs");
        
        const txBody = CardanoWasm.TransactionBody.from_bytes(
          Buffer.from(transaction.body, 'hex')
        );
        const witnessSet = CardanoWasm.TransactionWitnessSet.from_bytes(
          Buffer.from(transaction.witnessSet, 'hex')
        );

        // Create witness
        const privateKey = CardanoWasm.PrivateKey.from_bytes(signer.privateKey);
        const vkeyWitness = CardanoWasm.make_vkey_witness(
          CardanoWasm.hash_transaction(txBody),
          privateKey
        );

        // Add witness to witness set
        const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
        vkeyWitnesses.add(vkeyWitness);
        witnessSet.set_vkeys(vkeyWitnesses);

        // Create final transaction
        const finalTx = CardanoWasm.Transaction.new(
          txBody,
          witnessSet,
          transaction.auxiliaryData 
            ? CardanoWasm.AuxiliaryData.from_bytes(Buffer.from(transaction.auxiliaryData, 'hex'))
            : undefined
        );

        return Buffer.from(finalTx.to_bytes()).toString('hex');
      }
    } catch (error) {
      throw new SwapKitError({
        errorKey: "toolbox_cardano_sign_transaction_error",
        info: { error: error.message },
      });
    }
  };
}

function broadcastTransaction(network: CardanoNetwork) {
  return async (signedTxHex: string): Promise<string> => {
    try {
      const blockfrost = await getBlockfrostClient(network);
      
      const response = await blockfrost.request('/tx/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/cbor',
        },
        body: Buffer.from(signedTxHex, 'hex'),
      });

      return response; // This should be the transaction hash
    } catch (error) {
      throw new SwapKitError({
        errorKey: "toolbox_cardano_broadcast_error",
        info: { error: error.message },
      });
    }
  };
}

export async function createKeysForPath({
  phrase,
  derivationPath = DerivationPath.ADA,
  network = "mainnet",
}: {
  phrase: string;
  derivationPath?: string;
  network?: CardanoNetwork;
}): Promise<CardanoKeypair> {
  try {
    const { mnemonicToEntropy } = await import("@scure/bip39");
    const CardanoWasm = await import("@emurgo/cardano-serialization-lib-nodejs");

    // Convert mnemonic to entropy
    const entropy = mnemonicToEntropy(phrase);
    
    // Create root key from entropy
    const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
      Buffer.from(entropy, 'hex'),
      Buffer.from('') // No passphrase
    );

    // Parse derivation path (e.g., "m/1852'/1815'/0'/0/0")
    const pathParts = derivationPath.replace("m/", "").split("/");
    let privateKey = rootKey;

    for (const part of pathParts) {
      const index = part.endsWith("'") || part.endsWith("h")
        ? parseInt(part.slice(0, -1)) + 0x80000000 // Hardened derivation
        : parseInt(part);
      privateKey = privateKey.derive(index);
    }

    const publicKey = privateKey.to_public();
    
    // Create address
    const paymentKey = publicKey.to_raw_key();
    const paymentKeyHash = paymentKey.hash();
    
    const networkId = network === "mainnet" ? 1 : 0;
    
    const baseAddress = CardanoWasm.BaseAddress.new(
      networkId,
      CardanoWasm.StakeCredential.from_keyhash(paymentKeyHash),
      CardanoWasm.StakeCredential.from_keyhash(paymentKeyHash) // Using same key for staking for simplicity
    );

    const address = baseAddress.to_address().to_bech32();
    
    // Create stake address
    const stakeAddress = CardanoWasm.RewardAddress.new(
      networkId,
      CardanoWasm.StakeCredential.from_keyhash(paymentKeyHash)
    ).to_address().to_bech32();

    return {
      privateKey: privateKey.as_bytes(),
      publicKey: publicKey.as_bytes(),
      address,
      stakeAddress,
    };
  } catch (error) {
    throw new SwapKitError({
      errorKey: "toolbox_cardano_create_keys_error",
      info: { error: error.message },
    });
  }
}
