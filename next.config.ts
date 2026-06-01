import type { NextConfig } from "next";

const imageHostname = process.env.IMAGE_HOSTNAME ?? "**.mediofertas.co";

const securityHeaders = [
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "X-Frame-Options",         value: "DENY" },
  { key: "X-XSS-Protection",        value: "1; mode=block" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  compress: false, // compresión delegada a Traefik (brotli + gzip)
  allowedDevOrigins: ["192.168.1.200"],
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "@prisma/adapter-utils"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: imageHostname },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
