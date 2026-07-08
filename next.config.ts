import type { NextConfig } from "next";

const LOCAL_API_BASE_URL = "http://localhost:5000";
const PROD_API_BASE_URL = "https://backend.piccworldwide.org";

const normalizeConfiguredBaseUrl = (value: string | undefined): string | null => {
  if (!value) return null;

  const normalized = value.trim().replace(/\/+$/, "");
  try {
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
};

const apiBase =
  process.env.NODE_ENV === "production"
    ? PROD_API_BASE_URL
    : normalizeConfiguredBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) || LOCAL_API_BASE_URL;
const apiUrl = new URL(apiBase);
const apiProtocol = apiUrl.protocol === "https:" ? "https" : "http";
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    workerThreads: true,
  },
  images: {
    // Next blocks proxying to private IPs by default; allow it for local dev when your API base is localhost.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiUrl.hostname,
        port: apiUrl.port || undefined,
        pathname: "/**",
      },
      // Explicitly allow your Hostinger backend
      {
        protocol: "https",
        hostname: "backend.piccworldwide.org",
        port: "", // Leave port empty for standard https
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
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com https://www.google.com https://www.podbean.com https://*.podbean.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
