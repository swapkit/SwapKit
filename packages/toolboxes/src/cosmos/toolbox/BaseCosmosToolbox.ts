import { base64, bech32 } from "@scure/base";
import {
  AssetValue,
  Chain,
  type ChainId,
  type CosmosChain,
  CosmosChainPrefixes,
  DerivationPath,
  SKConfig,
  SwapKitError,
} from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";

import type { TransferParams } from "../types";
import {
  DEFAULT_COSMOS_FEE_MAINNET,
  createSigningStargateClient,
  createStargateClient,
  getAssetFromDenom,
  getMsgSendDenom,
} from "../util";

type Params = {
  chain: CosmosChain;
  derivationPath?: DerivationPath;
  prefix?: string;
  index?: number;
};

export type BaseCosmosToolboxType = ReturnType<typeof BaseCosmosToolbox>;
export type BaseCosmosWallet = ReturnType<typeof BaseCosmosToolbox>;
export type CosmosWallets = {
  [chain in Chain.Cosmos | Chain.Kujira]: BaseCosmosWallet;
};

export function BaseCosmosToolbox({
  chain,
  derivationPath: paramsDerivationPath,
  index = 0,
  prefix,
}: Params) {
  const rpcUrl = SKConfig.get("rpcUrls")[chain];
  const chainPrefix = prefix || CosmosChainPrefixes[chain];
  const derivationPath = paramsDerivationPath
    ? `${paramsDerivationPath}/${index}`
    : `${DerivationPath[chain]}/${index}`;

  const getCosmosAccount = cosmosAccountGetter({ prefix: chainPrefix, derivationPath });
  const getCosmosBalance = cosmosBalanceGetter({ chain, rpcUrl });

  return {
    transfer: cosmosTransfer(rpcUrl),
    getBalanceAsDenoms: cosmosBalanceDenomsGetter(rpcUrl),
    getBalance: getCosmosBalance,
    getSigner: getSigner({ prefix: chainPrefix, derivationPath }),
    createPrivateKeyFromPhrase: createPrivateKeyFromPhrase(derivationPath),
    validateAddress: validateAddress(chainPrefix),
    getSignerFromPrivateKey: async (privateKey: Uint8Array) => {
      const { DirectSecp256k1Wallet } = await import("@cosmjs/proto-signing");
      return DirectSecp256k1Wallet.fromKey(privateKey, chainPrefix);
    },
    getAccount: async (address: string) => {
      const client = await createStargateClient(rpcUrl);
      return client.getAccount(address);
    },
    getAddressFromMnemonic: async (phrase: string) => {
      const account = await getCosmosAccount(phrase);
      return account.address;
    },
    getPubKeyFromMnemonic: async (phrase: string) => {
      const account = await getCosmosAccount(phrase);
      return base64.encode(account.pubkey);
    },
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

export function estimateTransactionFee({ assetValue: { chain } }: { assetValue: AssetValue }) {
  return AssetValue.from({ chain, value: getMinTransactionFee(chain) });
}

function getSigner({ prefix, derivationPath }: { prefix: string; derivationPath: string }) {
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

function cosmosTransfer(rpcUrl: string) {
  return async function transfer({
    from,
    recipient,
    assetValue,
    memo = "",
    fee = DEFAULT_COSMOS_FEE_MAINNET,
    signer,
  }: TransferParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_cosmos_signer_not_defined");
    }

    const signingClient = await createSigningStargateClient(rpcUrl, signer);
    const message = [
      {
        denom: getMsgSendDenom(`u${assetValue.symbol}`).toLowerCase(),
        amount: assetValue.getBaseValue("string"),
      },
    ];

    const { transactionHash } = await signingClient.sendTokens(from, recipient, message, fee, memo);

    return transactionHash;
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

function cosmosBalanceGetter({ chain, rpcUrl }: { chain: Chain; rpcUrl: string }) {
  return async function getCosmosBalance(address: string) {
    const denomBalances = await cosmosBalanceDenomsGetter(rpcUrl)(address);

    const balances = denomBalances
      .filter(({ denom }) => denom && !denom.includes("IBC/"))
      .map(({ denom, amount }) => {
        const fullDenom =
          [Chain.THORChain, Chain.Maya].includes(chain) && denom.includes("/")
            ? `${chain}.${denom}`
            : denom;
        return getAssetFromDenom(fullDenom, amount);
      });

    return balances;
  };
}

function cosmosAccountGetter({
  prefix,
  derivationPath,
}: { prefix: string; derivationPath: string }) {
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
