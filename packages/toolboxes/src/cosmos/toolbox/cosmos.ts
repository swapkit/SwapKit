import type { StdFee } from "@cosmjs/amino";
import type { Account } from "@cosmjs/stargate";
import { base64, bech32 } from "@scure/base";
import {
  AssetValue,
  applyFeeMultiplier,
  Chain,
  type ChainId,
  type CosmosChain,
  CosmosChainPrefixes,
  DerivationPath,
  type DerivationPathArray,
  derivationPathToString,
  FeeOption,
  type GenericTransferParams,
  getChainConfig,
  getRPCUrl,
  NetworkDerivationPath,
  SwapKitError,
  SwapKitNumber,
  type TCLikeChain,
  updateDerivationPath,
} from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";
import { match, P } from "ts-pattern";
import type { CosmosToolboxParams } from "../types";
import {
  cosmosCreateTransaction,
  createSigningStargateClient,
  createStargateClient,
  getAssetFromDenom,
  getDenomWithChain,
  getMsgSendDenom,
} from "../util";

export async function fetchFeeRateFromSwapKit(chainId: ChainId, safeDefault: number) {
  try {
    const response = await SwapKitApi.getGasRate();
    const responseGasRate = response.find((gas) => gas.chainId === chainId)?.value;

    return responseGasRate ? Number.parseFloat(responseGasRate) : safeDefault;
  } catch {
    return safeDefault;
  }
}

export async function getSignerFromPhrase({
  phrase,
  prefix,
  ...derivationParams
}: { phrase: string; prefix?: string } & ({ chain: Chain; index?: number } | { derivationPath: string })) {
  const importedProtoSigning = await import("@cosmjs/proto-signing");
  const DirectSecp256k1HdWallet =
    importedProtoSigning.DirectSecp256k1HdWallet ?? importedProtoSigning.default?.DirectSecp256k1HdWallet;
  const importedCrypto = await import("@cosmjs/crypto");
  const stringToPath = importedCrypto.stringToPath ?? importedCrypto.default?.stringToPath;

  const derivationPath =
    "derivationPath" in derivationParams
      ? derivationParams.derivationPath
      : `${DerivationPath[derivationParams.chain]}/${derivationParams.index}`;

  return DirectSecp256k1HdWallet.fromMnemonic(phrase, { hdPaths: [stringToPath(derivationPath)], prefix });
}

export async function getSignerFromPrivateKey({ privateKey, prefix }: { privateKey: Uint8Array; prefix: string }) {
  const importedProtoSigning = await import("@cosmjs/proto-signing");
  const DirectSecp256k1Wallet =
    importedProtoSigning.DirectSecp256k1Wallet ?? importedProtoSigning.default?.DirectSecp256k1Wallet;

  return DirectSecp256k1Wallet.fromKey(privateKey, prefix);
}

const SafeDefaultFeeValues = {
  [Chain.Cosmos]: 500,
  [Chain.Kujira]: 1000,
  [Chain.Noble]: 1000,
  [Chain.THORChain]: 5000000,
  [Chain.Maya]: 5000000,
  [Chain.Harbor]: 5000000,
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

    const importedCrypto = await import("@cosmjs/crypto");
    const Secp256k1Signature = importedCrypto.Secp256k1Signature ?? importedCrypto.default?.Secp256k1Signature;
    const Secp256k1 = importedCrypto.Secp256k1 ?? importedCrypto.default?.Secp256k1;

    const secpSignature = Secp256k1Signature.fromFixedLength(base64.decode(signature));
    return Secp256k1.verifySignature(secpSignature, base64.decode(message), account.pubkey.value);
  };
}

export async function createCosmosToolbox({ chain, ...toolboxParams }: CosmosToolboxParams) {
  const rpcUrl = await getRPCUrl(chain);
  const chainPrefix = CosmosChainPrefixes[chain];

  const index = "index" in toolboxParams ? toolboxParams.index || 0 : 0;
  const derivationPath = derivationPathToString(
    "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[chain], { index }),
  );

  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, ({ phrase }) => getSignerFromPhrase({ derivationPath, phrase, prefix: chainPrefix }))
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

    const feeAssetValue = AssetValue.from({ chain });
    const assetDenom = getDenomWithChain(feeAssetValue);

    const txFee = feeRate || feeToStdFee((await getFees(chain, SafeDefaultFeeValues[chain]))[feeOptionKey], assetDenom);

    const signingClient = await createSigningStargateClient(rpcUrl, signer);
    const message = [
      { amount: assetValue.getBaseValue("string"), denom: getMsgSendDenom(`u${assetValue.symbol}`).toLowerCase() },
    ];

    const { transactionHash } = await signingClient.sendTokens(from, recipient, message, txFee, memo);

    return transactionHash;
  }

  return {
    createPrivateKeyFromPhrase: createPrivateKeyFromPhrase(derivationPath),
    createTransaction: cosmosCreateTransaction,
    fetchFeeRateFromSwapKit,
    getAccount,
    getAddress,
    getBalance: async (address: string, _potentialScamFilter?: boolean) => {
      const denomBalances = await cosmosBalanceDenomsGetter(rpcUrl)(address);
      const balances = await Promise.all(
        denomBalances
          .filter(({ denom }) => denom && !denom.includes("IBC/"))
          .map(({ denom, amount }) => {
            const fullDenom =
              [Chain.THORChain, Chain.Maya].includes(chain as TCLikeChain) &&
              (denom.includes("/") || denom.includes("˜"))
                ? `${chain}.${denom}`
                : denom;
            return getAssetFromDenom(fullDenom, amount);
          }),
      );

      if (balances.length === 0) {
        return [AssetValue.from({ chain })];
      }

      return balances;
    },
    getBalanceAsDenoms: cosmosBalanceDenomsGetter(rpcUrl),
    getFees: () => getFees(chain, SafeDefaultFeeValues[chain]),
    getPubKey,
    getSignerFromPhrase: async ({ phrase, derivationPath }: { phrase: string; derivationPath: DerivationPathArray }) =>
      getSignerFromPhrase({
        derivationPath: derivationPathToString(derivationPath),
        index,
        phrase,
        prefix: chainPrefix,
      }),
    getSignerFromPrivateKey: async (privateKey: Uint8Array) => {
      const importedSigning = await import("@cosmjs/proto-signing");
      const DirectSecp256k1Wallet =
        importedSigning.DirectSecp256k1Wallet ?? importedSigning.default?.DirectSecp256k1Wallet;
      return DirectSecp256k1Wallet.fromKey(privateKey, chainPrefix);
    },
    transfer,
    validateAddress: getCosmosValidateAddress(chain),
    verifySignature: verifySignature(getAccount),
  };
}

export async function getFeeRateFromSwapKit(chainId: ChainId, safeDefault: number) {
  try {
    const response = await SwapKitApi.getGasRate();
    const responseGasRate = response.find((gas) => gas.chainId === chainId)?.value;

    return responseGasRate ? Number.parseFloat(responseGasRate) : safeDefault;
  } catch {
    return safeDefault;
  }
}

export function estimateTransactionFee({ assetValue: { chain } }: { assetValue: AssetValue }) {
  return AssetValue.from({ chain, value: getMinTransactionFee(chain) });
}

async function getFees(chain: Chain, safeDefault: number) {
  const { chainId, baseDecimal } = getChainConfig(chain);

  const baseFee = await fetchFeeRateFromSwapKit(chainId, safeDefault);
  return {
    average: SwapKitNumber.fromBigInt(BigInt(baseFee), baseDecimal),
    fast: SwapKitNumber.fromBigInt(BigInt(applyFeeMultiplier(baseFee, FeeOption.Fast, true)), baseDecimal),
    fastest: SwapKitNumber.fromBigInt(BigInt(applyFeeMultiplier(baseFee, FeeOption.Fastest, true)), baseDecimal),
  } as { [key in FeeOption]: SwapKitNumber };
}

function feeToStdFee(fee: SwapKitNumber, denom: string): StdFee {
  return { amount: [{ amount: fee.getBaseValue("string"), denom }], gas: "200000" };
}

function getMinTransactionFee(chain: Chain) {
  return (
    {
      [Chain.Cosmos]: 0.007,
      [Chain.Kujira]: 0.02,
      [Chain.Noble]: 0.01,
      [Chain.THORChain]: 0.02,
      [Chain.Maya]: 0.02,
      [Chain.Harbor]: 0.02,
    }[chain as CosmosChain] || 0
  );
}

export function getCosmosValidateAddress(chain: CosmosChain) {
  const chainPrefix = CosmosChainPrefixes[chain];
  return function validateAddress(address: string) {
    if (!address.startsWith(chainPrefix)) return false;

    try {
      const { prefix, words } = bech32.decode(address as `${string}1${string}`);
      const normalized = bech32.encode(prefix, words);

      return normalized === address.toLocaleLowerCase();
    } catch {
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
    const importedCrypto = await import("@cosmjs/crypto");
    const stringToPath = importedCrypto.stringToPath ?? importedCrypto.default?.stringToPath;
    const Slip10Curve = importedCrypto.Slip10Curve ?? importedCrypto.default?.Slip10Curve;
    const Slip10 = importedCrypto.Slip10 ?? importedCrypto.default?.Slip10;
    const EnglishMnemonic = importedCrypto.EnglishMnemonic ?? importedCrypto.default?.EnglishMnemonic;
    const Bip39 = importedCrypto.Bip39 ?? importedCrypto.default?.Bip39;

    const mnemonicChecked = new EnglishMnemonic(phrase);
    const seed = await Bip39.mnemonicToSeed(mnemonicChecked);

    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, stringToPath(derivationPath));

    return privkey;
  };
}
