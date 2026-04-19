import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep the client-side router cache fresh for longer so tapping back to a
    // recently-visited tab renders instantly from the cache instead of
    // re-rendering on the server. Realtime subscriptions keep the cached UI
    // live.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
