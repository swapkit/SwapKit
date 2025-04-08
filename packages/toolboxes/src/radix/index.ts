import type {
  FungibleResourcesCollectionItem,
  GatewayApiClient,
  StateEntityDetailsVaultResponseItem,
  StateEntityFungiblesPageRequest,
  StateEntityFungiblesPageResponse,
} from "@radixdlt/babylon-gateway-api-sdk";
import { AssetValue, Chain, type SKConfigIntegrations } from "@swapkit/helpers";

export type RadixWallet = Awaited<ReturnType<typeof RadixToolbox>>;

type RadixGetBalanceParams = {
  address: string;
  networkApi: GatewayApiClient;
};
// Could not find anything sync in SDK, ask Radix team
export function validateAddress(address: string) {
  return address.startsWith("account_rdx1") && address.length === 66;
}

function getBalance({ networkApi }: { networkApi: GatewayApiClient }) {
  return async function getBalance(address: string) {
    const fungibleResources = await fetchFungibleResources({ address, networkApi });
    const fungibleBalances = convertResourcesToBalances({
      resources: fungibleResources,
      networkApi,
    });
    return fungibleBalances;
  };
}

async function fetchFungibleResources({
  address,
  networkApi,
}: RadixGetBalanceParams): Promise<FungibleResourcesCollectionItem[]> {
  let hasNextPage = true;
  let nextCursor: string | undefined;
  let fungibleResources: FungibleResourcesCollectionItem[] = [];
  const stateVersion = await currentStateVersion(networkApi);
  while (hasNextPage) {
    const stateEntityFungiblesPageRequest: StateEntityFungiblesPageRequest = {
      address: address,
      limit_per_page: 100,
      cursor: nextCursor,
      at_ledger_state: {
        state_version: stateVersion,
      },
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
async function convertResourcesToBalances({
  resources,
  networkApi,
}: {
  resources: FungibleResourcesCollectionItem[]; //| NonFungibleResourcesCollectionItem[];
  networkApi: GatewayApiClient;
}): Promise<AssetValue[]> {
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
          divisibilities.set(result.address, {
            decimals: result.details.divisibility,
            symbol,
          });
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

async function currentStateVersion(networkApi: GatewayApiClient) {
  return networkApi.status.getCurrent().then((status) => status.ledger_state.state_version);
}

export const RadixToolbox = async ({
  dappConfig,
}: { dappConfig: SKConfigIntegrations["radix"] }) => {
  const { RadixDappToolkit } = await import("@radixdlt/radix-dapp-toolkit");
  const { GatewayApiClient } = await import("@radixdlt/babylon-gateway-api-sdk");

  const radixToolkit = RadixDappToolkit({
    ...dappConfig,
    networkId: dappConfig.network?.networkId || 1,
  });

  const networkApi = GatewayApiClient.initialize(radixToolkit.gatewayApi.clientConfig);

  return {
    getAddress: () => "",
    getBalance: getBalance({ networkApi }),
    networkApi,
    validateAddress,
    signAndBroadcast: (() => {
      throw new Error("Not implemented");
    }) as (params: any) => Promise<string>,
  };
};
