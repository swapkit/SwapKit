import { serve } from "bun";
import index from "../pages/index.html";
import widget from "../pages/widget.html";

const server = serve({
  routes: {
    "/*": index,
    "/widget": widget,
  },

  development: process.env.NODE_ENV !== "production",
});

console.info(`🚀 Server running at ${server.url}`);
