import { SwapKit } from "@swapkit/sdk";

export const getSwapKitClient = ({
  ethplorer,
  covalent,
  blockchair,
  walletConnectProjectId,
  brokerEndpoint,
}: {
  ethplorer?: string;
  covalent?: string;
  blockchair?: string;
  walletConnectProjectId?: string;
  brokerEndpoint?: string;
} = {}) => {
  return SwapKit({
    config: {
      apiKeys: {
        ethplorer,
        covalent,
        blockchair,
        walletConnectProjectId,
        keepKey: localStorage.getItem("keepkeyApiKey") || "1234",
      },
      integrations: {
        keepKey: {
          name: "swapKit-demo-app",
          imageUrl:
            "https://repository-images.githubusercontent.com/587472295/feec8a61-39b2-4615-b293-145e97f49b5a",
          basePath: "http://localhost:1646/spec/swagger.json",
          url: "http://localhost:1646",
        },
        chainflip: {
          brokerUrl: brokerEndpoint || "",
        },
      },
    },
  });
};

export type SwapKitClient = ReturnType<typeof getSwapKitClient>;
