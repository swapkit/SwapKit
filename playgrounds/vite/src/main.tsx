import { SwapKitWidget } from "@swapkit/ui/react";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App";

function AppWrapper() {
  const [isWidget, setIsWidget] = useState(true);

  return (
    <>
      <button onClick={() => setIsWidget(!isWidget)} type="button">
        {isWidget ? "Hide Widget" : "Show Widget"}
      </button>

      {isWidget ? <SwapKitWidget apiKey="" /> : <App />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
);
