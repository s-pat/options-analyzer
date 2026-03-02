import type { NextConfig } from "next";

// API_BACKEND_URL is a server-side-only env var — never exposed to the browser.
// Set it to your deployed backend URL in production (e.g. https://your-api.railway.app).
// In development it defaults to localhost:8080.
const apiBackendUrl = process.env.API_BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBackendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
