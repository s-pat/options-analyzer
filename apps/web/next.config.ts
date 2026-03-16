import type { NextConfig } from "next";

// API_BACKEND_URL is a server-side-only env var — never exposed to the browser.
// Set it to your deployed backend URL in production (e.g. https://your-api.railway.app).
// In development it defaults to localhost:8080.
const apiBackendUrl = process.env.API_BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  // When deployed (API_BACKEND_URL is set), bake the Railway URL into the client
  // bundle so the browser calls Railway directly — bypasses Vercel's SSRF protection.
  // In local dev (no API_BACKEND_URL), the browser uses /api/v1 and hits the rewrite below.
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_BACKEND_URL
      ? `${process.env.API_BACKEND_URL}/api/v1`
      : "/api/v1",
  },
  // Tree-shake lucide-react so only imported icons are bundled
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBackendUrl}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Cache static assets aggressively (JS/CSS chunks are hashed)
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
