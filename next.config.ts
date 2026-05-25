import type { NextConfig } from "next";

const imageHostname = process.env.IMAGE_HOSTNAME ?? "**.farmacompara.co";

const nextConfig: NextConfig = {
  output: "standalone",
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
