import type { NextConfig } from "next";

const imageHostname = process.env.IMAGE_HOSTNAME ?? "**.mediofertas.co";

const securityHeaders = [
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "X-Frame-Options",         value: "DENY" },
  { key: "X-XSS-Protection",        value: "1; mode=block" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS obligatorio 1 año. Sin includeSubDomains/preload para no afectar a otros subdominios.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // CSP mínima que no restringe scripts (Next inline, Umami, Google OAuth). Una CSP
  // completa con nonces queda pendiente: requiere probar login y analítica.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  compress: false, // compresión delegada a Traefik (brotli + gzip)
  // Páginas ISR: una caché compartida puede servir la versión vieja como máximo
  // 1 día mientras se regenera (el valor por defecto de Next es 1 año).
  expireTime: 86400,
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
