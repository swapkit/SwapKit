import {
  type FungibleResourcesCollectionItem,
  GatewayApiClient,
  type StateEntityDetailsVaultResponseItem,
  type StateEntityFungiblesPageRequest,
  type StateEntityFungiblesPageResponse,
} from "@radixdlt/babylon-gateway-api-sdk";
import { DataRequestBuilder, RadixDappToolkit } from "@radixdlt/radix-dapp-toolkit";
import {
  AssetValue,
  Chain,
  type ConnectWalletParams,
  WalletOption,
  setRequestClientConfig,
} from "@swapkit/helpers";

const RadixMainnet = {
  networkId: 1,
  networkName: "mainnet",
  dashboardBase: "https://dashboard.radixdlt.com",
};

type RadixDappConfig = {
  dAppDefinitionAddress: string;
  network: typeof RadixMainnet;
  applicationName: string;
  applicationVersion: string;
};

async function fetchFungibleResources({
  address,
  networkApi,
}: any): Promise<FungibleResourcesCollectionItem[]> {
  let hasNextPage = true;
  let nextCursor = undefined;
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

async function currentStateVersion(networkApi: GatewayApiClient) {
  return networkApi.status.getCurrent().then((status) => status.ledger_state.state_version);
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
  const resourceBatches = [];
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
  // Iterate through resources
  return balances;
}

const getWalletMethods = async (dappConfig: RadixDappConfig) => {
  const rdt = RadixDappToolkit({ ...dappConfig, networkId: dappConfig.network.networkId });

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  await delay(400);

  const getAddress = () => {
    const existingWalletData = rdt.walletApi.getWalletData();
    const account = existingWalletData?.accounts?.[0];

    return account?.address;
  };

  const getNewAddress = async () => {
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

  const connectIfNoAddress = async () => (await getAddress()) || (await getNewAddress());

  const address = await connectIfNoAddress();

  const networkApi = GatewayApiClient.initialize({
    networkId: RadixMainnet.networkId,
    applicationName: dappConfig.applicationName,
  });

  return {
    radixDappToolkit: rdt,
    address,
    getBalance: () => getBalance({ networkApi })(address),
    transfer: (_params: { assetValue: AssetValue; recipient: string; from: string }) => {
      throw new Error("Not implemented");
    },
    signAndBroadcast: async ({ manifest, message }: { manifest: string; message: string }) => {
      const txResult = (
        await rdt.walletApi.sendTransaction({
          transactionManifest: manifest,
          message,
        })
      ).unwrapOr(null)?.transactionIntentHash;

      if (!txResult) {
        throw new Error("wallet_radix_transaction_failed");
      }

      return txResult;
    },
    getAddress: getAddress,
  };
};

function connectRadixWallet({
  addChain,
  config: {
    thorswapApiKey,
    radixDappConfig = {
      network: RadixMainnet,
      dAppDefinitionAddress: "account_rdx128r289p58222hcvev7frs6kue76pl7pdcnw8725aw658v0zggkh9ws",
      applicationName: "Swapkit Playground",
      applicationVersion: "0.0.1",
    },
  },
}: ConnectWalletParams & {
  radixDappConfig?: RadixDappConfig;
}) {
  return async function connectRadixWallet(_chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const walletMethods = await getWalletMethods({
      ...radixDappConfig,
    });

    addChain({
      chain: Chain.Radix,
      balance: [],
      walletType: WalletOption.RADIX_WALLET,
      ...walletMethods,
    });

    return true;
  };
}

export const radixWallet = { connectRadixWallet } as const;
