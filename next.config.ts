import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Gamle ruter (installerede PWA'er kan have dem cachet)
    return [
      { source: '/dashboard', destination: '/hjem', permanent: true },
      { source: '/shopping', destination: '/indkoeb', permanent: true },
      { source: '/history', destination: '/mig/historik', permanent: true },
      { source: '/settings', destination: '/mig', permanent: true },
    ]
  },
};

export default nextConfig;
