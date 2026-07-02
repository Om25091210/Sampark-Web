import type { NextConfig } from "next";

// Applied to every route. Conservative set — no strict CSP, so nothing in the
// app breaks; tighten later once a backend/CSP policy is defined.
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hide the "X-Powered-By: Next.js" header.
  poweredByHeader: false,
  // Allows the LAN IP to hit the dev server; ignored in production builds.
  allowedDevOrigins: ["192.168.29.225"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
