import { base64, bech32 } from "@scure/base";
import {
  AssetValue,
  BaseDecimal,
  Chain,
  type ChainId,
  ChainToChainId,
  type CosmosChain,
  CosmosChainPrefixes,
  DerivationPath,
  FeeOption,
  SKConfig,
  SwapKitError,
  SwapKitNumber,
} from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";

import type { StdFee } from "@cosmjs/amino";
import type { Account } from "@cosmjs/stargate";
import { getBalance } from "../../utils";
import type { CosmosSigner, TransferParams } from "../types";
import {
  buildNativeTransferTx,
  createSigningStargateClient,
  createStargateClient,
  getDenomWithChain,
  getMsgSendDenom,
} from "../util";

export type CosmosToolboxParams = {
  chain: CosmosChain;
  derivationPath?: DerivationPath;
  index?: number;
  signer?: CosmosSigner;
};

export type BaseCosmosToolboxType = ReturnType<typeof BaseCosmosToolbox>;
export type BaseCosmosWallet = ReturnType<typeof BaseCosmosToolbox>;
export type CosmosWallets = {
  [chain in Chain.Cosmos | Chain.Kujira]: BaseCosmosWallet;
};

export async function fetchFeeRateFromSwapKit(chainId: ChainId, safeDefault: number) {
  try {
    const response = await SwapKitApi.getGasRate();
    const responseGasRate = response.find((gas) => gas.chainId === chainId)?.value;

    return responseGasRate ? Number.parseFloat(responseGasRate) : safeDefault;
  } catch (e) {
    console.error(e);
    return safeDefault;
  }
}

export async function getSignerFromPhrase({
  phrase,
  prefix,
  index = 0,
  ...derivationParams
}: { phrase: string; prefix?: string; index?: number } & (
  | { chain: Chain }
  | { derivationPath: string }
)) {
  const { DirectSecp256k1HdWallet } = await import("@cosmjs/proto-signing");
  const { stringToPath } = await import("@cosmjs/crypto");

  const derivationPath =
    "derivationPath" in derivationParams
      ? `${derivationParams.derivationPath}/${index}`
      : `${DerivationPath[derivationParams.chain]}/${index}`;

  return DirectSecp256k1HdWallet.fromMnemonic(phrase, {
    prefix,
    hdPaths: [stringToPath(derivationPath)],
  });
}

export async function getSignerFromPrivateKey({
  privateKey,
  prefix,
}: {
  privateKey: Uint8Array;
  prefix: string;
}) {
  const { DirectSecp256k1Wallet } = await import("@cosmjs/proto-signing");

  return DirectSecp256k1Wallet.fromKey(privateKey, prefix);
}

async function getFees(chain: Chain, safeDefault: number) {
  const baseFee = await fetchFeeRateFromSwapKit(ChainToChainId[chain], safeDefault);
  return {
    average: SwapKitNumber.fromBigInt(BigInt(baseFee), BaseDecimal[chain]),
    fast: SwapKitNumber.fromBigInt(BigInt(Math.floor(baseFee * 1.5)), BaseDecimal[chain]),
    fastest: SwapKitNumber.fromBigInt(BigInt(Math.floor(baseFee * 2)), BaseDecimal[chain]),
  } as { [key in FeeOption]: SwapKitNumber };
}

function feeToStdFee(fee: SwapKitNumber, denom: string): StdFee {
  return {
    amount: [{ denom, amount: fee.getBaseValue("string") }],
    gas: "200000",
  };
}

const SafeDefaultFeeValues = {
  [Chain.Cosmos]: 500,
  [Chain.Kujira]: 1000,
  [Chain.THORChain]: 5000000,
  [Chain.Maya]: 5000000,
};

export function verifySignature(getAccount: (address: string) => Promise<Account | null>) {
  return async function verifySignature({
    signature,
    message,
    address,
  }: {
    signature: string;
    message: string;
    address: string;
  }) {
    const account = await getAccount(address);
    if (!account?.pubkey) throw new SwapKitError("toolbox_cosmos_verify_signature_no_pubkey");
    const { Secp256k1Signature, Secp256k1 } = await import("@cosmjs/crypto");

    const secpSignature = Secp256k1Signature.fromFixedLength(base64.decode(signature));
    return Secp256k1.verifySignature(secpSignature, base64.decode(message), account.pubkey.value);
  };
}

export function BaseCosmosToolbox({
  chain,
  derivationPath: paramsDerivationPath,
  index = 0,
  signer,
}: CosmosToolboxParams) {
  const rpcUrl = SKConfig.get("rpcUrls")[chain];
  const chainPrefix = CosmosChainPrefixes[chain];
  const derivationPath = paramsDerivationPath ? paramsDerivationPath : DerivationPath[chain];
  const getCosmosAccount = cosmosAccountGetter({ prefix: chainPrefix, derivationPath });

  async function getAccount(address: string) {
    const client = await createStargateClient(rpcUrl);
    return client.getAccount(address);
  }

  async function transfer({
    from,
    recipient,
    assetValue,
    memo = "",
    fee,
    feeOptionKey = FeeOption.Fast,
  }: TransferParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_cosmos_signer_not_defined");
    }

    const feeAssetValue = AssetValue.from({
      chain,
    });
    const assetDenom = getDenomWithChain(feeAssetValue);

    const txFee =
      fee ||
      feeToStdFee((await getFees(chain, SafeDefaultFeeValues[chain]))[feeOptionKey], assetDenom);

    const signingClient = await createSigningStargateClient(rpcUrl, signer);
    const message = [
      {
        denom: getMsgSendDenom(`u${assetValue.symbol}`).toLowerCase(),
        amount: assetValue.getBaseValue("string"),
      },
    ];

    const { transactionHash } = await signingClient.sendTokens(
      from,
      recipient,
      message,
      txFee,
      memo,
    );

    return transactionHash;
  }

  return {
    transfer,
    getBalance: getBalance(chain),
    getSigner: getSigner({ prefix: chainPrefix, derivationPath }),
    getSignerFromPhrase: async (phrase: string) =>
      getSignerFromPhrase({
        phrase,
        prefix: chainPrefix,
        derivationPath,
        index,
      }),
    getSignerFromPrivateKey: async (privateKey: Uint8Array) => {
      const { DirectSecp256k1Wallet } = await import("@cosmjs/proto-signing");
      return DirectSecp256k1Wallet.fromKey(privateKey, chainPrefix);
    },
    createPrivateKeyFromPhrase: createPrivateKeyFromPhrase(derivationPath),
    getAccount: async (address: string) => {
      const client = await createStargateClient(rpcUrl);
      return client.getAccount(address);
    },
    validateAddress: validateAddress(chainPrefix),
    getAddressFromMnemonic: async (phrase: string) => {
      const account = await getCosmosAccount(phrase);
      return account.address;
    },
    getPubKeyFromMnemonic: async (phrase: string) => {
      const account = await getCosmosAccount(phrase);
      return base64.encode(account.pubkey);
    },
    getFees: () => getFees(chain, SafeDefaultFeeValues[chain]),
    fetchFeeRateFromSwapKit,
    getBalanceAsDenoms: cosmosBalanceDenomsGetter(rpcUrl),
    buildTransferTx: buildNativeTransferTx,
    verifySignature: verifySignature(getAccount),
  };
}

export async function getFeeRateFromThorswap(chainId: ChainId, safeDefault: number) {
  try {
    const response = await SwapKitApi.getGasRate();
    const responseGasRate = response.find((gas) => gas.chainId === chainId)?.value;

    return responseGasRate ? Number.parseFloat(responseGasRate) : safeDefault;
  } catch (e) {
    console.error(e);
    return safeDefault;
  }
}

export function cosmosValidateAddress({
  address,
  chain,
  prefix: chainPrefix,
}: { address: string } & (
  | { prefix: string; chain?: undefined }
  | { chain: CosmosChain; prefix?: undefined }
)) {
  const prefix = chainPrefix || getPrefix(chain);

  if (!(prefix && address)) {
    throw new SwapKitError("toolbox_cosmos_validate_address_prefix_not_found");
  }

  return validateAddress(prefix)(address);
}

export function estimateTransactionFee({
  assetValue: { chain },
}: {
  assetValue: AssetValue;
}) {
  return AssetValue.from({ chain, value: getMinTransactionFee(chain) });
}

function getSigner({
  prefix,
  derivationPath,
}: {
  prefix: string;
  derivationPath: string;
}) {
  return async function getSigner(phrase: string) {
    const { DirectSecp256k1HdWallet } = await import("@cosmjs/proto-signing");
    const { stringToPath } = await import("@cosmjs/crypto");

    return DirectSecp256k1HdWallet.fromMnemonic(phrase, {
      prefix,
      hdPaths: [stringToPath(derivationPath)],
    });
  };
}

function getPrefix<C extends CosmosChain>(chain?: C) {
  const { isStagenet } = SKConfig.get("envs");
  const useStagenetPrefix = chain
    ? [Chain.THORChain, Chain.Maya].includes(chain) && isStagenet
    : false;
  const basePrefix = chain ? CosmosChainPrefixes[chain] : undefined;

  return useStagenetPrefix ? `s${basePrefix}` : basePrefix;
}

function getMinTransactionFee(chain: Chain) {
  return (
    {
      [Chain.Cosmos]: 0.007,
      [Chain.Kujira]: 0.02,
      [Chain.THORChain]: 0.02,
      [Chain.Maya]: 0.02,
    }[chain as CosmosChain] || 0
  );
}

function validateAddress(prefix: string) {
  return function validateAddress(address: string) {
    if (!address.startsWith(prefix)) return false;

    try {
      const { prefix, words } = bech32.decode(address as `${string}1${string}`);
      const normalized = bech32.encode(prefix, words);

      return normalized === address.toLocaleLowerCase();
    } catch (_error) {
      return false;
    }
  };
}

function cosmosBalanceDenomsGetter(rpcUrl: string) {
  return async function getCosmosBalanceDenoms(address: string) {
    const client = await createStargateClient(rpcUrl);
    const allBalances = await client.getAllBalances(address);

    const balances = allBalances.map((balance) => ({
      ...balance,
      denom: balance.denom.includes("/") ? balance.denom.toUpperCase() : balance.denom,
    }));

    return balances;
  };
}

function cosmosAccountGetter({
  prefix,
  derivationPath,
}: {
  prefix: string;
  derivationPath: string;
}) {
  return async function getCosmosAccount(phrase: string) {
    const { Secp256k1HdWallet } = await import("@cosmjs/amino");
    const { stringToPath } = await import("@cosmjs/crypto");

    const wallet = await Secp256k1HdWallet.fromMnemonic(phrase, {
      prefix,
      hdPaths: [stringToPath(derivationPath)],
    });

    const [account] = await wallet.getAccounts();

    if (!account) {
      throw new SwapKitError("toolbox_cosmos_no_accounts_found");
    }

    return account;
  };
}

function createPrivateKeyFromPhrase(derivationPath: string) {
  return async function createPrivateKeyFromPhrase(phrase: string) {
    const { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } = await import(
      "@cosmjs/crypto"
    );

    const mnemonicChecked = new EnglishMnemonic(phrase);
    const seed = await Bip39.mnemonicToSeed(mnemonicChecked);

    const { privkey } = Slip10.derivePath(
      Slip10Curve.Secp256k1,
      seed,
      stringToPath(derivationPath),
    );

    return privkey;
  };
}

export function createCosmosToolbox<C extends CosmosChain>(chain: C) {
  return (signer?: CosmosSigner) => BaseCosmosToolbox({ chain, signer });
}

export const GaiaToolbox = createCosmosToolbox(Chain.Cosmos);
export const KujiraToolbox = createCosmosToolbox(Chain.Kujira);
