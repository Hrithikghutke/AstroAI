import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["esbuild"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
