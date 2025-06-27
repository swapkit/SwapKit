/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Widget } from "../src/Widget";

const elem = document.getElementById("root");
if (!elem) {
  throw new Error("Root element not found");
}

const app = (
  <StrictMode>
    <Widget />
  </StrictMode>
);

if (import.meta.hot) {
  // biome-ignore lint/suspicious/noAssignInExpressions: skip
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
