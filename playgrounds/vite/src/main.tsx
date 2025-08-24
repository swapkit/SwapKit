import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import { CompactApp } from "./CompactApp";

function AppWrapper() {
  return <CompactApp />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
);
