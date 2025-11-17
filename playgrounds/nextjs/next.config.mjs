import { createRequire } from "module";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      {
        hostname: "storage.googleapis.com",
        pathname: "/token-list-swapkit-dev/**",
        protocol: "https",
      },
      {
        hostname: "storage.googleapis.com",
        pathname: "/token-list-swapkit/**",
        protocol: "https",
      },
    ],
  },
  reactStrictMode: true,
  transpilePackages: ["@swapkit/ui"],
  typescript: { ignoreBuildErrors: true },

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(new NodePolyfillPlugin());

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          global: require.resolve("global"),
          process: "process/browser",
        }),
      );

      config.plugins.push(
        new webpack.DefinePlugin({
          "global.Buffer": "Buffer",
          "global.crypto": "crypto",
          "global.msCrypto": "crypto",
          "global.Uint8Array": JSON.stringify(Uint8Array),
        }),
      );

      config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^node:crypto$/, require.resolve("crypto-browserify")));

      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve("buffer"),
        crypto: require.resolve("crypto-browserify"),
        fs: false,
        path: require.resolve("path-browserify"),
        process: require.resolve("process/browser"),
        stream: require.resolve("stream-browserify"),
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        crypto: require.resolve("crypto-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify/browser"),
        path: require.resolve("path-browserify"),
        process: require.resolve("process/browser"),
        stream: require.resolve("stream-browserify"),
      };
    }

    config.experiments = { ...config.experiments, asyncWebAssembly: true, syncWebAssembly: true, topLevelAwait: true };

    return config;
  },
};

export default nextConfig;
