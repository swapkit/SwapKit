import type {
  FungibleResourcesCollectionItem,
  GatewayApiClient,
  StateEntityDetailsVaultResponseItem,
  StateEntityFungiblesPageRequest,
  StateEntityFungiblesPageResponse,
} from "@radixdlt/babylon-gateway-api-sdk";
import {
  AssetValue,
  Chain,
  SKConfig,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import { getWalletSupportedChains } from "../helpers";

export const radixWallet = createWallet({
  name: "connectRadixWallet",
  walletType: WalletOption.RADIX_WALLET,
  supportedChains: [Chain.Radix],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectRadixWallet(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });
      const radixConfig = SKConfig.get("integrations").radix;

      if (!radixConfig) {
        throw new SwapKitError("wallet_radix_not_found");
      }

      await Promise.all(
        filteredChains.map(async (chain) => {
          const walletMethods = await getWalletMethods();

          addChain({ ...walletMethods, chain, walletType });
        }),
      );

      return true;
    },
});

export const RADIX_SUPPORTED_CHAINS = getWalletSupportedChains(radixWallet);

async function fetchFungibleResources(address: string): Promise<FungibleResourcesCollectionItem[]> {
  const { GatewayApiClient } = await import("@radixdlt/babylon-gateway-api-sdk");
  const { applicationName } = SKConfig.get("integrations").radix;
  const networkApi = GatewayApiClient.initialize({ networkId: 1, applicationName });

  let hasNextPage = true;
  let nextCursor: string | undefined;
  let fungibleResources: FungibleResourcesCollectionItem[] = [];

  const stateVersion = await currentStateVersion(networkApi);

  while (hasNextPage) {
    const stateEntityFungiblesPageRequest: StateEntityFungiblesPageRequest = {
      address: address,
      limit_per_page: 100,
      cursor: nextCursor,
      at_ledger_state: { state_version: stateVersion },
    };

    const stateEntityFungiblesPageResponse: StateEntityFungiblesPageResponse =
      await networkApi.state.innerClient.entityFungiblesPage({
        stateEntityFungiblesPageRequest: stateEntityFungiblesPageRequest,
      });

    fungibleResources = fungibleResources.concat(stateEntityFungiblesPageResponse.items);

    if (stateEntityFungiblesPageResponse.next_cursor) {
      nextCursor = stateEntityFungiblesPageResponse.next_cursor;
    } else {
      hasNextPage = false;
    }
  }
  return fungibleResources;
}

async function currentStateVersion(networkApi: GatewayApiClient) {
  return networkApi.status.getCurrent().then((status) => status.ledger_state.state_version);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Split into multiple functions
async function getBalance(address: string): Promise<AssetValue[]> {
  const { GatewayApiClient } = await import("@radixdlt/babylon-gateway-api-sdk");
  const resources = await fetchFungibleResources(address);
  const { applicationName } = SKConfig.get("integrations").radix;
  const networkApi = GatewayApiClient.initialize({ networkId: 1, applicationName });

  const balances: AssetValue[] = [];
  const BATCH_SIZE = 50;

  // Split resources into batches of up to 50 items
  const resourceBatches: FungibleResourcesCollectionItem[][] = [];
  for (let i = 0; i < resources.length; i += BATCH_SIZE) {
    resourceBatches.push(resources.slice(i, i + BATCH_SIZE));
  }

  for (const batch of resourceBatches) {
    const addresses = batch.map((item) => item.resource_address);
    const response: StateEntityDetailsVaultResponseItem[] =
      await networkApi.state.getEntityDetailsVaultAggregated(addresses);

    const divisibilities = new Map<string, { decimals: number; symbol: string }>();

    for (const result of response) {
      if (result.details !== undefined) {
        const metaDataSymbol = result.metadata?.items.find((item) => item.key === "symbol");
        const symbol =
          metaDataSymbol?.value.typed.type === "String" ? metaDataSymbol.value.typed.value : "?";

        if (result.details.type === "FungibleResource") {
          divisibilities.set(result.address, { decimals: result.details.divisibility, symbol });
        }
      }
    }

    for (const item of batch) {
      if (item.aggregation_level === "Global") {
        const assetInfo = divisibilities.get(item.resource_address) || { decimals: 0, symbol: "?" };

        const balance = AssetValue.from({
          asset:
            assetInfo.symbol !== Chain.Radix
              ? `${Chain.Radix}.${assetInfo.symbol}-${item.resource_address}`
              : "XRD.XRD",
          value: item.amount,
        });
        balances.push(balance);
      }
    }
  }

  return balances;
}

async function getWalletMethods() {
  const { RadixDappToolkit } = await import("@radixdlt/radix-dapp-toolkit");
  const dappConfig = SKConfig.get("integrations").radix;
  const rdt = RadixDappToolkit({ ...dappConfig, networkId: dappConfig.network.networkId });

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // TODO: @Towan - Wat is dat?
  await delay(400);

  function getAddress() {
    const existingWalletData = rdt.walletApi.getWalletData();
    const account = existingWalletData?.accounts?.[0];

    return account?.address;
  }

  const getNewAddress = async () => {
    const { DataRequestBuilder } = await import("@radixdlt/radix-dapp-toolkit");
    rdt.walletApi.setRequestData(DataRequestBuilder.accounts().exactly(1));
    const res = await rdt.walletApi.sendRequest();

    if (!res) {
      throw new Error("wallet_radix_no_account");
    }

    const newAddress = res.unwrapOr(null)?.accounts[0]?.address;

    if (!newAddress) {
      throw new Error("wallet_radix_no_account");
    }

    return newAddress;
  };

  const address = getAddress() || (await getNewAddress());

  return {
    radixDappToolkit: rdt,
    address,
    getAddress,
    getBalance: () => getBalance(address),
    transfer: (_params: { assetValue: AssetValue; recipient: string; from: string }) => {
      throw new Error("Not implemented");
    },
    signAndBroadcast: async ({ manifest, message }: { manifest: string; message: string }) => {
      const tx = await rdt.walletApi.sendTransaction({
        transactionManifest: manifest,
        message,
      });

      const txResult = tx.unwrapOr(null)?.transactionIntentHash;

      if (!txResult) {
        throw new Error("wallet_radix_transaction_failed");
      }

      return txResult;
    },
  };
}
