import "./App.css";
import { SwapKitWidget } from "@swapkit/ui/react";

function App() {
  return (
    <SwapKitWidget
      config={{
        apiKeys: {
          keepKey: typeof window !== "undefined" ? localStorage.getItem("keepkeyApiKey") || "1234" : "1234",
          swapKit: "123",
          walletConnectProjectId: "",
        },
        envs: { devApiUrl: "https://dev-api.swapkit.dev", isDev: true },
        integrations: {
          keepKey: {
            basePath: "http://localhost:1646/spec/swagger.json",
            imageUrl:
              "https://raw.githubusercontent.com/swapkit/SwapKit/refs/heads/develop/docs/src/assets/logo-black.png",
            name: "SwapKit",
            url: "http://localhost:1646",
          },
        },
      }}
    />
  );
}

export default App;
