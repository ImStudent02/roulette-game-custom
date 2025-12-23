import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow .onion domains for Tor hidden service access in dev mode
  allowedDevOrigins: [
    'http://*.onion',
  ],
};

export default nextConfig;


