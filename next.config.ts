import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
    turbo: {
      rules: {
        "*.pdf": {
          loaders: ["file-loader"],
          as: "*.pdf",
        },
      },
      resolveAlias: {
        "pdf-parse": "pdf-parse",
      },
    },
  },
  // Keep webpack config as fallback for production builds
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.externals.push({
        "pdf-parse": "commonjs pdf-parse",
      });
    }
    return config;
  },
};

export default nextConfig;
