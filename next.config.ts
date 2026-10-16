import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Hold klient-cachen af faner i live lidt længere, så et tryk tilbage til en
    // nyligt besøgt fane er øjeblikkeligt. Realtime holder indholdet opdateret.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
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
