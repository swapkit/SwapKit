import App from "./src/index.html";

const server = Bun.serve({
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/*": App,

    "/api/hello": {
      GET: function get() {
        console.info("get(): here?");
        return Response.json({ message: "Hello, world!", method: "GET" });
      },
      PUT: function put() {
        console.info("put(): here?");
        return Response.json({ message: "Hello, world!", method: "PUT" });
      },
    },

    "/api/hello/:name": function hello(req) {
      const name = req.params.name;
      return Response.json({ message: `Hello, ${name}!` });
    },
  },
});

console.info(`🚀 Server running at ${server.url}`);
