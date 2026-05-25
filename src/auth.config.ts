import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Config ligera sin Prisma — compatible con Edge Runtime (middleware)
export const authConfig: NextAuthConfig = {
  providers: [
    // Solo declaramos el provider para que el middleware reconozca el tipo de sesión.
    // La lógica de authorize está en auth.ts (Node.js runtime).
    Credentials({ credentials: { email: {}, password: {} }, authorize: async () => null }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth }) {
      // Por defecto todas las rutas son públicas.
      // Cambia este callback cuando quieras proteger rutas específicas.
      return true;
    },
  },
};
