import {
  AssetValue,
  Chain,
  type CryptoChain,
  ProviderName,
  SwapKitError,
  type SwapParams,
  createPlugin,
} from "@swapkit/helpers";
import { type QuoteResponseRoute, SwapKitApi } from "@swapkit/helpers/api";
import type { NearWallet } from "@swapkit/toolboxes/near";
import { calculateNearNameCost, validateNearName } from "./nearNames";
import type { NearNameRegistrationParams } from "./types";

export const NearPlugin = createPlugin({
  name: "near",
  properties: {
    supportedSwapkitProviders: [ProviderName.NEAR],
  },
  methods: ({ getWallet }) => ({
    async swap(swapParams: SwapParams<"near", QuoteResponseRoute>) {
      const {
        route: {
          buyAsset: buyAssetString,
          sellAsset: sellAssetString,
          sellAmount,
          meta: { near },
        },
      } = swapParams;

      if (!(sellAssetString && buyAssetString && near?.sellAsset)) {
        throw new SwapKitError("core_swap_asset_not_recognized");
      }

      const sellAsset = await AssetValue.from({
        asyncTokenLookup: true,
        asset: sellAssetString,
        value: sellAmount,
      });

      const wallet = getWallet(sellAsset.chain as Exclude<CryptoChain, Chain.Radix>);

      if (!wallet) {
        throw new SwapKitError("core_wallet_connection_not_found");
      }

      const { depositAddress } = await SwapKitApi.getNearDepositChannel(near);

      const tx = await wallet.transfer({
        assetValue: sellAsset,
        recipient: depositAddress,
        isProgramDerivedAddress: true,
      });

      return tx as string;
    },

    // NEAR Names functionality
    nearNames: {
      async resolve(name: string) {
        try {
          const normalizedName = name.toLowerCase().replace(/\.near$/, "");

          if (!validateNearName(normalizedName)) {
            throw new SwapKitError("plugin_near_invalid_name");
          }

          const wallet = getWallet(Chain.Near);

          if (!wallet) {
            throw new SwapKitError("plugin_near_no_connection");
          }

          const result = await wallet.provider.query({
            request_type: "call_function",
            finality: "final",
            account_id: "near",
            method_name: "resolve",
            args_base64: Buffer.from(JSON.stringify({ name: normalizedName })).toString("base64"),
          });

          const response = JSON.parse(Buffer.from((result as any).result).toString());
          return response?.owner || null;
        } catch {
          return null;
        }
      },

      async isAvailable(name: string) {
        const owner = await this.resolve(name);
        return owner === null;
      },

      async getInfo(name: string) {
        try {
          const normalizedName = name.toLowerCase().replace(/\.near$/, "");

          if (!validateNearName(normalizedName)) {
            throw new SwapKitError("plugin_near_invalid_name");
          }

          const wallet = getWallet(Chain.Near);

          if (!wallet) {
            throw new SwapKitError("plugin_near_no_connection");
          }

          const result = await wallet.provider.query({
            request_type: "call_function",
            finality: "final",
            account_id: "near",
            method_name: "get_info",
            args_base64: Buffer.from(JSON.stringify({ name: normalizedName })).toString("base64"),
          });

          const response = JSON.parse(Buffer.from((result as any).result).toString());
          return response || null;
        } catch {
          return null;
        }
      },

      async lookupNames(accountId: string) {
        try {
          const wallet = getWallet(Chain.Near);

          if (!wallet) {
            throw new SwapKitError("plugin_near_no_connection");
          }

          const result = await wallet.provider.query({
            request_type: "call_function",
            finality: "final",
            account_id: "near",
            method_name: "get_names_by_owner",
            args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString("base64"),
          });

          const response = JSON.parse(Buffer.from((result as any).result).toString());
          return Array.isArray(response) ? response.map((n) => `${n}.near`) : [];
        } catch {
          return [];
        }
      },

      async register(params: NearNameRegistrationParams) {
        const { name, publicKey: publicKeyOverwrite } = params;
        const normalizedName = name.toLowerCase().replace(/\.near$/, "");

        if (!validateNearName(normalizedName)) {
          throw new SwapKitError("plugin_near_invalid_name");
        }

        const wallet = getWallet(Chain.Near) as NearWallet;

        const newPublicKey = publicKeyOverwrite || (await wallet.getPublicKey());

        const cost = calculateNearNameCost(normalizedName);

        return wallet.callFunction({
          contractId: "near",
          methodName: "create_account",
          args: {
            new_account_id: `${normalizedName}.near`,
            new_public_key: newPublicKey,
          },
          deposit: cost,
        });
      },

      transfer(name: string, newOwner: string) {
        const normalizedName = name.toLowerCase().replace(/\.near$/, "");

        if (!validateNearName(normalizedName)) {
          throw new SwapKitError("plugin_near_invalid_name");
        }

        const wallet = getWallet(Chain.Near) as NearWallet;

        return wallet.callFunction({
          contractId: "near",
          methodName: "transfer",
          args: {
            name: normalizedName,
            new_owner: newOwner,
          },
          deposit: "1",
        });
      },
    },
  }),
});
