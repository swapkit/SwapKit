import { AssetValue, createSwapKit } from "@swapkit/sdk";

let skClient: ReturnType<typeof createSwapKit> | undefined;

export const getSwapKitClient = ({
  walletConnectProjectId,
  brokerEndpoint,
}: {
  walletConnectProjectId?: string;
  brokerEndpoint?: string;
} = {}) => {
  if (skClient) {
    return skClient;
  }

  skClient = createSwapKit({
    config: {
      apiKeys: {
        keepKey: localStorage.getItem("keepkeyApiKey") || "1234",
        swapKit: "3a86e7e1-54fd-4766-8cf5-d16ae00dde1b",
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
      envs: { isDev: true },
    },
  });

  return skClient;
};

await AssetValue.loadStaticAssets();

export type SwapKitClient = ReturnType<typeof getSwapKitClient>;
