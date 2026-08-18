/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Subject banners and the favicon are local /public assets, but
  // merchandise listing photos are hosted on Cloudinary — allow-list that
  // host specifically rather than reopening the previous unused
  // `hostname: "**"` wildcard.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Tree-shake icon and animation libraries — only import what's actually used
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
  // Compress responses
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            // 'unsafe-inline'/'unsafe-eval' on scripts is required by
            // Next.js's own inline bootstrap scripts and the Spline/recharts
            // runtime; tightening further would need a nonce-based setup
            // that's out of scope for a drop-in header change. connect-src
            // covers the app's own API plus Upstash Redis, Supabase
            // Postgres access is server-side only (not called from the
            // browser) and Spline's scene CDN.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com",
              "font-src 'self' data:",
              "media-src 'self' data: blob:",
              // unpkg.com: @splinetool/runtime fetches its modelling WASM
              // module from there at runtime, not from Spline's own domain.
              "connect-src 'self' https://*.upstash.io https://prod.spline.design https://unpkg.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
