import type { StdFee } from "@cosmjs/amino";
import type { Account } from "@cosmjs/stargate";
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
  type DerivationPathArray,
  FeeOption,
  type GenericTransferParams,
  NetworkDerivationPath,
  SKConfig,
  SwapKitError,
  SwapKitNumber,
  applyFeeMultiplier,
  derivationPathToString,
  updateDerivationPath,
} from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";
import { P, match } from "ts-pattern";
import { getBalance } from "../../utils";
import type { CosmosToolboxParams } from "../types";
import {
  cosmosCreateTransaction,
  createSigningStargateClient,
  createStargateClient,
  getDenomWithChain,
  getMsgSendDenom,
} from "../util";

export async function fetchFeeRateFromSwapKit(chainId: ChainId, safeDefault: number) {
  try {
    const response = await SwapKitApi.getGasRate();
    const responseGasRate = response.find((gas) => gas.chainId === chainId)?.value;

    return responseGasRate ? Number.parseFloat(responseGasRate) : safeDefault;
  } catch (_e) {
    return safeDefault;
  }
}

export async function getSignerFromPhrase({
  phrase,
  prefix,
  ...derivationParams
}: { phrase: string; prefix?: string } & (
  | { chain: Chain; index?: number }
  | { derivationPath: string }
)) {
  const { DirectSecp256k1HdWallet } = (await import("@cosmjs/proto-signing")).default;
  const { stringToPath } = (await import("@cosmjs/crypto")).default;

  const derivationPath =
    "derivationPath" in derivationParams
      ? derivationParams.derivationPath
      : `${DerivationPath[derivationParams.chain]}/${derivationParams.index}`;

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
  const { DirectSecp256k1Wallet } = (await import("@cosmjs/proto-signing")).default;

  return DirectSecp256k1Wallet.fromKey(privateKey, prefix);
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
    const { Secp256k1Signature, Secp256k1 } = (await import("@cosmjs/crypto")).default;

    const secpSignature = Secp256k1Signature.fromFixedLength(base64.decode(signature));
    return Secp256k1.verifySignature(secpSignature, base64.decode(message), account.pubkey.value);
  };
}

export async function createCosmosToolbox({ chain, ...toolboxParams }: CosmosToolboxParams) {
  const rpcUrl = SKConfig.get("rpcUrls")[chain];
  const chainPrefix = CosmosChainPrefixes[chain];

  const index = "index" in toolboxParams ? toolboxParams.index || 0 : 0;
  const derivationPath = derivationPathToString(
    "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[chain], { index }),
  );

  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, ({ phrase }) =>
      getSignerFromPhrase({ phrase, prefix: chainPrefix, derivationPath }),
    )
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  async function getAccount(address: string) {
    const client = await createStargateClient(rpcUrl);
    return client.getAccount(address);
  }

  async function getAddress() {
    const [account] = (await signer?.getAccounts()) || [];
    return account?.address;
  }

  async function getPubKey() {
    const [account] = (await signer?.getAccounts()) || [];
    if (!account?.pubkey) {
      throw new SwapKitError("toolbox_cosmos_signer_not_defined");
    }
    return base64.encode(account?.pubkey);
  }

  async function transfer({
    recipient,
    assetValue,
    memo = "",
    feeRate,
    feeOptionKey = FeeOption.Fast,
  }: GenericTransferParams) {
    const from = await getAddress();

    if (!(signer && from)) {
      throw new SwapKitError("toolbox_cosmos_signer_not_defined");
    }

    const feeAssetValue = AssetValue.from({
      chain,
    });
    const assetDenom = getDenomWithChain(feeAssetValue);

    const txFee =
      feeRate ||
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
    getAddress,
    getAccount,
    getBalance: getBalance(chain),
    getSignerFromPhrase: async ({
      phrase,
      derivationPath,
    }: { phrase: string; derivationPath: DerivationPathArray }) =>
      getSignerFromPhrase({
        phrase,
        prefix: chainPrefix,
        derivationPath: derivationPathToString(derivationPath),
        index,
      }),
    getSignerFromPrivateKey: async (privateKey: Uint8Array) => {
      const { DirectSecp256k1Wallet } = (await import("@cosmjs/proto-signing")).default;
      return DirectSecp256k1Wallet.fromKey(privateKey, chainPrefix);
    },
    createPrivateKeyFromPhrase: createPrivateKeyFromPhrase(derivationPath),
    validateAddress: getCosmosValidateAddress(chainPrefix),
    getPubKey,
    getFees: () => getFees(chain, SafeDefaultFeeValues[chain]),
    fetchFeeRateFromSwapKit,
    getBalanceAsDenoms: cosmosBalanceDenomsGetter(rpcUrl),
    createTransaction: cosmosCreateTransaction,
    verifySignature: verifySignature(getAccount),
  };
}

export async function getFeeRateFromThorswap(chainId: ChainId, safeDefault: number) {
  try {
    const response = await SwapKitApi.getGasRate();
    const responseGasRate = response.find((gas) => gas.chainId === chainId)?.value;

    return responseGasRate ? Number.parseFloat(responseGasRate) : safeDefault;
  } catch (_e) {
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

  return getCosmosValidateAddress(prefix)(address);
}

export function estimateTransactionFee({
  assetValue: { chain },
}: {
  assetValue: AssetValue;
}) {
  return AssetValue.from({ chain, value: getMinTransactionFee(chain) });
}

function getPrefix<C extends CosmosChain>(chain?: C) {
  const { isStagenet } = SKConfig.get("envs");
  const useStagenetPrefix = chain
    ? [Chain.THORChain, Chain.Maya].includes(chain) && isStagenet
    : false;
  const basePrefix = chain ? CosmosChainPrefixes[chain] : undefined;

  return useStagenetPrefix ? `s${basePrefix}` : basePrefix;
}

async function getFees(chain: Chain, safeDefault: number) {
  const baseFee = await fetchFeeRateFromSwapKit(ChainToChainId[chain], safeDefault);
  return {
    average: SwapKitNumber.fromBigInt(BigInt(baseFee), BaseDecimal[chain]),
    fast: SwapKitNumber.fromBigInt(
      BigInt(applyFeeMultiplier(baseFee, FeeOption.Fast, true)),
      BaseDecimal[chain],
    ),
    fastest: SwapKitNumber.fromBigInt(
      BigInt(applyFeeMultiplier(baseFee, FeeOption.Fastest, true)),
      BaseDecimal[chain],
    ),
  } as { [key in FeeOption]: SwapKitNumber };
}

function feeToStdFee(fee: SwapKitNumber, denom: string): StdFee {
  return {
    amount: [{ denom, amount: fee.getBaseValue("string") }],
    gas: "200000",
  };
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

function getCosmosValidateAddress(prefix: string) {
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
