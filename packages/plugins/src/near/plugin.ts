import {
  AssetValue,
  Chain,
  ProviderName,
  SwapKitError,
  type SwapParams,
  createPlugin,
} from "@swapkit/helpers";
import { SwapKitApi } from "@swapkit/helpers/api";
import type { NearWallet } from "@swapkit/toolboxes/near";
import { calculateNearNameCost, validateNearName } from "./nearNames";
import type {
  NearDepositChannelParams,
  NearNameInfo,
  NearNameRegistrationParams,
  NearSwapResponse,
  NearSwapRoute,
} from "./types";

export const NearPlugin = createPlugin({
  name: "near",
  properties: {
    supportedSwapkitProviders: [ProviderName.NEAR],
  },
  methods: ({ getWallet }) => ({
    async swap({
      route,
      recipient,
    }: SwapParams<{
      route: NearSwapRoute & {
        meta?: {
          nearSwapInfo?: NearDepositChannelParams;
        };
      };
    }>) {
      const { meta } = route as any;
      if (!meta?.nearSwapInfo) {
        throw new SwapKitError("core_swap_invalid_params", {
          message: "Missing NEAR swap metadata",
        });
      }

      const nearSwapInfo = meta.nearSwapInfo;
      const srcWallet = await getWallet(nearSwapInfo.srcChain);

      const nearDepositChannelParams: NearDepositChannelParams = {
        ...nearSwapInfo,
        toAddress: recipient || (await srcWallet.getAddress()),
      };

      // TODO: UPSTREAM getNearDepositChannel in SwapKitApi from v3 branch
      const response = await (SwapKitApi as any).getNearDepositChannel?.(nearDepositChannelParams);
      if (!response) {
        throw new SwapKitError("core_plugin_not_found", {
          info: "NEAR deposit channel API not implemented",
        });
      }
      const nearResponse = response as NearSwapResponse;

      if (!nearResponse.isSuccess) {
        throw new SwapKitError("core_swap_invalid_params", {
          message: "Failed to create NEAR deposit channel",
        });
      }

      const { channelId, depositAddress } = nearResponse.response;

      const assetValue = AssetValue.from({
        chain: nearSwapInfo.srcChain,
        symbol: nearSwapInfo.srcToken,
        value: nearSwapInfo.amount,
        decimal: (route as any).srcToken.decimals,
      });

      const txHash = await srcWallet.transfer({
        assetValue,
        recipient: depositAddress,
        memo: channelId,
      });

      return txHash;
    },

    // NEAR Names functionality
    nearNames: {
      async resolve(name: string): Promise<string | null> {
        try {
          const normalizedName = name.toLowerCase().replace(/\.near$/, "");

          if (!validateNearName(normalizedName)) {
            throw new SwapKitError("plugin_near_invalid_name");
          }

          const wallet = getWallet(Chain.Near) as NearWallet;
          const near = await wallet.getConnection();

          if (!near) {
            throw new SwapKitError("plugin_near_no_connection");
          }

          const result = await near.connection.provider.query({
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

      async isAvailable(name: string): Promise<boolean> {
        const owner = await this.resolve(name);
        return owner === null;
      },

      async getInfo(name: string): Promise<NearNameInfo | null> {
        try {
          const normalizedName = name.toLowerCase().replace(/\.near$/, "");

          if (!validateNearName(normalizedName)) {
            throw new SwapKitError("plugin_near_invalid_name");
          }

          const wallet = getWallet(Chain.Near) as NearWallet;
          const near = await wallet.getConnection();

          if (!near) {
            throw new SwapKitError("plugin_near_no_connection");
          }

          const result = await near.connection.provider.query({
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

      async lookupNames(accountId: string): Promise<string[]> {
        try {
          const wallet = getWallet(Chain.Near) as NearWallet;
          const near = await wallet.getConnection();

          if (!near) {
            throw new SwapKitError("plugin_near_no_connection");
          }

          const result = await near.connection.provider.query({
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

      async register(params: NearNameRegistrationParams): Promise<string> {
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
          attachedDeposit: cost,
        });
      },

      transfer(name: string, newOwner: string): Promise<string> {
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
          attachedDeposit: "1",
        });
      },
    },
  }),
});
