import { type AccountData, Secp256k1HdWallet } from "@cosmjs/amino";
import type { StdFee } from "@cosmjs/stargate";
import { base64, bech32 } from "@scure/base";
import { type ChainId, SwapKitError } from "@swapkit/helpers";

import { stringToPath } from "@cosmjs/crypto";
import type { CosmosSDKClientParams, TransferParams } from "./types";
import {
  DEFAULT_COSMOS_FEE_MAINNET,
  createSigningStargateClient,
  createStargateClient,
  getMsgSendDenom,
  getRPC,
} from "./util";

export class CosmosClient {
  server: string;
  chainId: ChainId;
  prefix = "";
  rpcUrl;

  // by default, cosmos chain
  constructor({ server, chainId, prefix = "cosmos", stagenet = false }: CosmosSDKClientParams) {
    this.rpcUrl = getRPC(chainId, stagenet);
    this.server = server;
    this.chainId = chainId;
    this.prefix = prefix;
  }

  getAddressFromMnemonic = async (mnemonic: string, derivationPath: string) => {
    const walletAccount = await this.#getWalletAccount(mnemonic, derivationPath);

    return walletAccount.address;
  };

  getPubKeyFromMnemonic = async (mnemonic: string, derivationPath: string) => {
    const walletAccount = await this.#getWalletAccount(mnemonic, derivationPath);

    return base64.encode(walletAccount.pubkey);
  };

  checkAddress = (address: string) => {
    if (!address.startsWith(this.prefix)) return false;

    try {
      const { prefix, words } = bech32.decode(address as `${string}1${string}`);
      const normalized = bech32.encode(prefix, words);

      return normalized === address.toLocaleLowerCase();
    } catch (_error) {
      return false;
    }
  };

  getBalance = async (address: string) => {
    const client = await createStargateClient(this.rpcUrl);

    const allBalances = (await client.getAllBalances(address)) as unknown as {
      denom: string;
      amount: string;
    }[];

    return allBalances.map((balance) => ({
      ...balance,
      denom: balance.denom.includes("/") ? balance.denom.toUpperCase() : balance.denom,
    }));
  };

  getAccount = async (address: string) => {
    const client = await createStargateClient(this.rpcUrl);
    return client.getAccount(address);
  };

  transfer = async ({
    from,
    recipient,
    assetValue,
    memo = "",
    fee = DEFAULT_COSMOS_FEE_MAINNET,
    signer,
  }: TransferParams) => {
    if (!signer) {
      throw new SwapKitError("toolbox_cosmos_signer_not_defined");
    }

    const signingClient = await createSigningStargateClient(this.rpcUrl, signer);
    const txResponse = await signingClient.sendTokens(
      from,
      recipient,
      [
        {
          denom: getMsgSendDenom(`u${assetValue.symbol}`).toLowerCase(),
          amount: assetValue.getBaseValue("string"),
        },
      ],
      fee as StdFee,
      memo,
    );

    return txResponse.transactionHash;
  };

  #getWallet = (mnemonic: string, derivationPath: string) => {
    return Secp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: this.prefix,
      hdPaths: [stringToPath(derivationPath)],
    });
  };

  #getWalletAccount = async (mnemonic: string, derivationPath: string) => {
    const wallet = await this.#getWallet(mnemonic, derivationPath);
    const accounts = await wallet.getAccounts();

    if (accounts.length === 0) {
      throw new SwapKitError("toolbox_cosmos_no_accounts_found");
    }

    return accounts[0] as AccountData;
  };
}
