/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  experimental: {
    // Tree-shake icon and animation libraries — only import what's actually used
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
  // Compress responses
  compress: true,
};
module.exports = nextConfig;
