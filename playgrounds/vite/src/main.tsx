import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App";

import { WalletProvider, createWallet } from "@swapkit/wallet-exodus";

export const exodusWallet = (() => {
  try {
    return createWallet({
      providers: {
        bitcoin: true,
        ethereum: true,
      },
    });
  } catch (error) {
    console.error("Failed to initialize Exodus wallet:", error);
    return null;
  }
})();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {process.env.ENABLE_PASSKEYS && exodusWallet ? (
      <WalletProvider wallet={exodusWallet}>
        <App />
      </WalletProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
