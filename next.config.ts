import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["unfundamental-unprivately-lilyana.ngrok-free.dev"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
