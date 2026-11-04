import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Staff Note is live data (cookies, logs, photos). Leave Cache Components
  // off so pages render on each request instead of trying to prerender them.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
