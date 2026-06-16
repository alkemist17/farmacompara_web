import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/imagen/"],
      disallow: [
        "/login",
        "/registro",
        "/recuperar-contrasena",
        "/nueva-contrasena",
        "/verificar-email",
        "/perfil",
        "/api/",
      ],
    },
    sitemap: "https://mediofertas.co/sitemap-index.xml",
  };
}
