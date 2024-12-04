import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { SwapKitApi } from "@swapkit/api";
import { AssetValue, Chain, ChainId, ChainIdToChain, type DerivationPath } from "@swapkit/helpers";

import { CosmosClient } from "../cosmosClient";
import type { ToolboxParams } from "../index";
import type { BaseCosmosToolboxType } from "../thorchainUtils/types/client-types";
import { getAssetFromDenom } from "../util";

type Params = {
  client: CosmosClient;
  decimal: number;
  derivationPath: DerivationPath;
};

export const getFeeRateFromThorswap = async (chainId: ChainId, safeDefault: number) => {
  try {
    const response = await SwapKitApi.getGasRate();

    const responseGasRate = response.find((gas) => gas.chainId === chainId)?.value;

    return responseGasRate ? Number.parseFloat(responseGasRate) : safeDefault;
  } catch (e) {
    console.error(e);
    return safeDefault;
  }
};

export const BaseCosmosToolbox = ({
  derivationPath,
  client: cosmosClient,
}: Params): BaseCosmosToolboxType => ({
  transfer: cosmosClient.transfer,
  getSigner: (phrase: string) => {
    return DirectSecp256k1HdWallet.fromMnemonic(phrase, {
      prefix: cosmosClient.prefix,
      hdPaths: [stringToPath(`${derivationPath}/0`)],
    });
  },
  getSignerFromPrivateKey: (privateKey: Uint8Array) => {
    return DirectSecp256k1Wallet.fromKey(privateKey, cosmosClient.prefix);
  },
  createPrivateKeyFromPhrase: async (phrase: string) => {
    const derivationPathString = stringToPath(`${derivationPath}/0`);
    const mnemonicChecked = new EnglishMnemonic(phrase);
    const seed = await Bip39.mnemonicToSeed(mnemonicChecked);

    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, derivationPathString);

    return privkey;
  },
  getAccount: cosmosClient.getAccount,
  validateAddress: cosmosClient.checkAddress,
  getAddressFromMnemonic: (phrase: string) =>
    cosmosClient.getAddressFromMnemonic(phrase, `${derivationPath}/0`),
  getPubKeyFromMnemonic: (phrase: string) =>
    cosmosClient.getPubKeyFromMnemonic(phrase, `${derivationPath}/0`),
  getFeeRateFromThorswap,
  getBalance: async (address: string, _potentialScamFilter?: boolean) => {
    const denomBalances = await cosmosClient.getBalance(address);
    const chain = ChainIdToChain[cosmosClient.chainId];
    return await Promise.all(
      denomBalances
        .filter(({ denom }) => denom && !denom.includes("IBC/"))
        .map(({ denom, amount }) => {
          const fullDenom =
            [Chain.THORChain, Chain.Maya].includes(chain) && denom.includes("/")
              ? `${chain}.${denom}`
              : denom;
          return getAssetFromDenom(fullDenom, amount);
        }),
    );
  },
});

export const cosmosValidateAddress = ({
  address,
  chain,
  stagenet = false,
  server,
}: ToolboxParams & {
  address: string;
  chain: Chain.THORChain | Chain.Maya | Chain.Kujira | Chain.Cosmos;
}) => {
  switch (chain) {
    case Chain.Cosmos: {
      const client = new CosmosClient({
        server: server || "https://node-router.thorswap.net/cosmos/rest",
        chainId: ChainId.Cosmos,
      });
      return client.checkAddress(address);
    }

    case Chain.Kujira: {
      const client = new CosmosClient({
        server: server || "https://lcd-kujira.synergynodes.com/",
        chainId: ChainId.Kujira,
        prefix: "kujira",
      });
      return client.checkAddress(address);
    }
    case Chain.THORChain: {
      const client = new CosmosClient({
        server: stagenet
          ? "https://stagenet-thornode.ninerealms.com"
          : "https://thornode.thorswap.net",
        chainId: stagenet ? ChainId.THORChainStagenet : ChainId.THORChain,
        prefix: `${stagenet ? "s" : ""}thor`,
        stagenet,
      });
      return client.checkAddress(address);
    }

    case Chain.Maya: {
      const client = new CosmosClient({
        server: stagenet
          ? "https://stagenet.mayanode.mayachain.info"
          : "https://mayanode.mayachain.info",
        chainId: stagenet ? ChainId.MayaStagenet : ChainId.Maya,
        prefix: `${stagenet ? "s" : ""}maya`,
        stagenet,
      });
      return client.checkAddress(address);
    }
  }
};

export const estimateTransactionFee = ({ assetValue }: { assetValue: AssetValue }) => {
  const chain = assetValue.chain;
  switch (chain) {
    case Chain.Cosmos: {
      return AssetValue.from({ chain: Chain.Cosmos, value: 0.007 });
    }
    case Chain.Kujira: {
      return AssetValue.from({ chain: Chain.Kujira, value: 0.02 });
    }
    case Chain.THORChain: {
      return AssetValue.from({ chain: Chain.THORChain, value: 0.02 });
    }
    case Chain.Maya: {
      return AssetValue.from({ chain: Chain.Maya, value: 0.02 });
    }
    default:
      return assetValue.set(0);
  }
};

export type BaseCosmosWallet = ReturnType<typeof BaseCosmosToolbox>;
export type CosmosWallets = {
  [chain in Chain.Cosmos | Chain.Kujira]: BaseCosmosWallet;
};
