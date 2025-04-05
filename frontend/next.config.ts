import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // This will exclude calibration routes that have our custom handlers
      {
        source: "/api/calibration/:id",
        has: [
          {
            type: 'header',
            key: 'x-skip-rewrite',
            value: 'true'
          }
        ],
        destination: "/api/calibration/:id", // Keep the same URL for our handler
      },
      // All other API routes go to the backend
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
