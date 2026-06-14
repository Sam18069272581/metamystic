import type { NextConfig } from "next";

const backendApiBaseUrl = (process.env.BACKEND_API_BASE_URL ?? "http://localhost:4000/api/v1").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  transpilePackages: ["@metamystic/shared"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendApiBaseUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
