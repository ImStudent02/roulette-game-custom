import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
  /* config options here */
// };

// export default nextConfig;

const nextConfig = {
  output: 'export',   // 👈 this makes Next.js put final site in
  ignoreDuringBuilds: true, // 👈 this disables ESLint during builds
};

export default nextConfig;

