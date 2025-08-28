import { serve } from "bun";
import index from "../pages/index.html";
import widget from "../pages/widget.html";

const server = serve({
  development: process.env.NODE_ENV !== "production",
  routes: { "/*": index, "/widget": widget },
});

console.info(`🚀 Server running at ${server.url}`);
