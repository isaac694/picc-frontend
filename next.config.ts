import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const apiUrl = new URL(apiBase);
const apiProtocol = apiUrl.protocol === "https:" ? "https" : "http";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiUrl.hostname,
        port: apiUrl.port || undefined,
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
