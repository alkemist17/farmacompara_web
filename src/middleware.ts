import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Usa solo authConfig (sin Prisma) para no cargar módulos Node.js en Edge Runtime
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
