import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: "export", // for static export
  eslint: {
    ignoreDuringBuilds: true, // ✅ proper way
  },
};

export default nextConfig;


