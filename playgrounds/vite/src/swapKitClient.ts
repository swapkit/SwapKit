import { AssetValue, createSwapKit } from "@swapkit/sdk";

let skClient: ReturnType<typeof createSwapKit> | undefined;
let currentConfig: { walletConnectProjectId?: string; brokerEndpoint?: string; swapKit?: string; blockfrost?: string } =
  {};

export const getSwapKitClient = ({
  walletConnectProjectId,
  brokerEndpoint,
  swapKit,
  blockfrost,
}: {
  walletConnectProjectId?: string;
  brokerEndpoint?: string;
  swapKit?: string;
  blockfrost?: string;
} = {}) => {
  const configChanged =
    currentConfig.walletConnectProjectId !== walletConnectProjectId ||
    currentConfig.brokerEndpoint !== brokerEndpoint ||
    currentConfig.swapKit !== swapKit ||
    currentConfig.blockfrost !== blockfrost;

  if (skClient && !configChanged) {
    return skClient;
  }

  if (configChanged && skClient) {
    skClient.disconnectAll();
    skClient = undefined;
  }

  currentConfig = { blockfrost, brokerEndpoint, swapKit, walletConnectProjectId };

  skClient = createSwapKit({
    config: {
      apiKeys: {
        blockfrost: blockfrost || "",
        keepKey: localStorage.getItem("keepkeyApiKey") || "1234",
        swapKit: swapKit || process.env.TEST_API_KEY || "",
        walletConnectProjectId: walletConnectProjectId || "",
        xaman: process.env.XAMAN_API_KEY || "",
      },
      integrations: {
        chainflip: { brokerUrl: brokerEndpoint || "" },
        keepKey: {
          basePath: "http://localhost:1646/spec/swagger.json",
          imageUrl: "https://repository-images.githubusercontent.com/587472295/feec8a61-39b2-4615-b293-145e97f49b5a",
          name: "swapKit-demo-app",
          url: "http://localhost:1646",
        },
      },
    },
  });

  return skClient;
};

export const resetSwapKitClient = () => {
  if (skClient) {
    skClient.disconnectAll();
  }
  skClient = undefined;
  currentConfig = {};
};

await AssetValue.loadStaticAssets();

export type SwapKitClient = ReturnType<typeof getSwapKitClient>;
