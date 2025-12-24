import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow .onion domains for Tor hidden service access in dev mode
  allowedDevOrigins: [
    '*.onion',
    'gdspc35oc33fg6lxv2axbi7wr3xzz6dmzloizzu3644i5o2ewluyxlqd.onion',
  ],
};

export default nextConfig;


