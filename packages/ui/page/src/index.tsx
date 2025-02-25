import { createRoot } from "react-dom/client";
import { App } from "./App";
import { getUrlParam } from "./utils";

function start() {
  const root = document.getElementById(getUrlParam("elementId") || "root");

  if (!root) return;

  createRoot(root).render(<App />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
