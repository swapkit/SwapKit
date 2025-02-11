import { createRequire } from "module";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/token-list-swapkit/**",
      },
    ],
  },

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(new NodePolyfillPlugin());

      config.plugins.push(
        new webpack.ProvidePlugin({
          global: require.resolve("global"),
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
      );

      config.plugins.push(
        new webpack.DefinePlugin({
          "global.crypto": "crypto",
          "global.msCrypto": "crypto",
          "global.process": "process",
          "global.Buffer": "Buffer",
          "global.Uint8Array": JSON.stringify(Uint8Array),
        }),
      );

      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve("buffer"),
        crypto: require.resolve("crypto-browserify"),
        fs: false,
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify"),
        process: require.resolve("process/browser"),
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        crypto: require.resolve("crypto-browserify"),
        path: require.resolve("path-browserify"),
        process: require.resolve("process/browser"),
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify/browser"),
      };
    }

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
      topLevelAwait: true,
    };

    return config;
  },
};

export default nextConfig;
