import { Chain, type ChainApis, ChainToChainId, EVMChains, createSwapKit } from "@swapkit/sdk";
import { alchemyApi } from "@swapkit/toolbox-evm";

export type SwapKitClient = ReturnType<typeof createSwapKit>;

let oldKey = "";
let client: SwapKitClient;

export const getSwapKitClient = (
  params: {
    ethplorerApiKey?: string;
    covalentApiKey?: string;
    alchemyApiKey?: string;
    blockchairApiKey?: string;
    walletConnectProjectId?: string;
    stagenet?: boolean;
    brokerEndpoint?: string;
  } = {},
) => {
  const key = JSON.stringify(params);

  if (key === oldKey) {
    return client;
  }

  oldKey = key;

  const apis: ChainApis = {};

  for (const chain of EVMChains) {
    if (params.alchemyApiKey) {
      apis[chain] = alchemyApi({
        apiKey: params.alchemyApiKey,
        chainId: ChainToChainId[Chain.Arbitrum],
      });
    }
  }

  client = createSwapKit({
    config: {
      ...params,
      keepkeyConfig: {
        apiKey: localStorage.getItem("keepkeyApiKey") || "1234",
        pairingInfo: {
          name: "swapKit-demo-app",
          imageUrl:
            "https://repository-images.githubusercontent.com/587472295/feec8a61-39b2-4615-b293-145e97f49b5a",
          basePath: "http://localhost:1646/spec/swagger.json",
          url: "http://localhost:1646",
        },
      },
      chainflipBrokerUrl: params.brokerEndpoint,
    },
    apis,
  });

  return client;
};
