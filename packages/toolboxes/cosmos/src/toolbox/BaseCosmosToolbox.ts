import { Secp256k1HdWallet } from "@cosmjs/amino";
import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { base64, bech32 } from "@scure/base";
import { SwapKitApi } from "@swapkit/api";
import {
  AssetValue,
  Chain,
  type ChainId,
  type CosmosChain,
  CosmosChainPrefixes,
  type DerivationPath,
  RPC_URLS,
  SwapKitError,
} from "@swapkit/helpers";

import type { BaseCosmosToolboxType } from "../thorchainUtils/types/client-types";
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
  derivationPath: DerivationPath;
  prefix?: string;
  rpcUrl?: string;
};

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

export function BaseCosmosToolbox({
  chain,
  derivationPath,
  prefix,
  rpcUrl,
}: Params): BaseCosmosToolboxType {
  const chainPrefix = prefix || CosmosChainPrefixes[chain];
  const chainRpcUrl = rpcUrl || RPC_URLS[chain];

  const getCosmosAccount = cosmosAccountGetter(chainPrefix);
  const getCosmosBalance = cosmosBalanceGetter({ chain, rpcUrl: chainRpcUrl });
  const getCosmosBalanceAsDenoms = cosmosBalanceDenomsGetter(chainRpcUrl);

  return {
    transfer: cosmosTransfer(chainRpcUrl),
    getSigner: (phrase: string) => {
      return DirectSecp256k1HdWallet.fromMnemonic(phrase, {
        prefix,
        hdPaths: [stringToPath(`${derivationPath}/0`)],
      });
    },
    getSignerFromPrivateKey: (privateKey: Uint8Array) => {
      return DirectSecp256k1Wallet.fromKey(privateKey, prefix);
    },
    createPrivateKeyFromPhrase: async (phrase: string) => {
      const derivationPathString = stringToPath(`${derivationPath}/0`);
      const mnemonicChecked = new EnglishMnemonic(phrase);
      const seed = await Bip39.mnemonicToSeed(mnemonicChecked);

      const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, derivationPathString);

      return privkey;
    },
    getAccount: async (address) => {
      const client = await createStargateClient(chainRpcUrl);
      return client.getAccount(address);
    },
    validateAddress: (address) => validateCosmosAddress({ prefix: chainPrefix, address }),
    getAddressFromMnemonic: async (phrase: string) => {
      const walletAccount = await getCosmosAccount({ phrase, derivationPath });

      return walletAccount.address;
    },
    getPubKeyFromMnemonic: async (phrase: string) => {
      const account = await getCosmosAccount({ phrase, derivationPath });
      return base64.encode(account.pubkey);
    },
    getFeeRateFromThorswap,
    getBalanceAsDenoms: getCosmosBalanceAsDenoms,
    getBalance: getCosmosBalance,
  };
}

export function cosmosValidateAddress({
  address,
  chain,
  prefix,
}: { address: string } & (
  | { prefix: string; chain?: undefined }
  | { chain: CosmosChain; prefix?: undefined }
)) {
  const chainPrefix = prefix || (chain ? CosmosChainPrefixes[chain] : undefined);

  if (!(chainPrefix && address)) {
    throw new SwapKitError("toolbox_cosmos_validate_address_prefix_not_found");
  }

  const valid = validateCosmosAddress({ prefix: chainPrefix, address });

  return valid;
}

export function estimateTransactionFee({ assetValue: { chain } }: { assetValue: AssetValue }) {
  return AssetValue.from({ chain, value: getMinTransactionFee(chain) });
}

export type BaseCosmosWallet = ReturnType<typeof BaseCosmosToolbox>;
export type CosmosWallets = {
  [chain in Chain.Cosmos | Chain.Kujira]: BaseCosmosWallet;
};

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

function validateCosmosAddress({ prefix, address }: { prefix: string; address: string }) {
  if (!address.startsWith(prefix)) return false;

  try {
    const { prefix, words } = bech32.decode(address);
    const normalized = bech32.encode(prefix, words);

    return normalized === address.toLocaleLowerCase();
  } catch (_error) {
    return false;
  }
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
  return async function getCosmosBalance(
    address: string,
    // filterFunc?: (params: { denom: string; amount: string }) => boolean,
  ) {
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

function cosmosAccountGetter(prefix: string) {
  return async function getCosmosAccount({
    phrase,
    derivationPath,
  }: { phrase: string; derivationPath: string }) {
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
