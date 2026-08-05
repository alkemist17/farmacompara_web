import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { isRateLimited, getIp } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email:    { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials, request) => {
        const ip = getIp(request);
        if (isRateLimited(`login:${ip}`, { max: 20, windowMs: 15 * 60 * 1000 })) return null;

        const email    = (credentials?.email as string | undefined)?.toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Bloquear login si el email no ha sido verificado
        if (!user.emailVerified) return null;

        return { id: user.id, name: user.name ?? null, email: user.email };
      },
    }),
  ],
  callbacks: {
    // Vincula automáticamente una cuenta de Google a un usuario ya existente
    // (registrado con contraseña) cuando el correo está verificado en ambos lados:
    // - Google confirma que la persona realmente controla ese correo (profile.email_verified)
    // - Nuestra cuenta local ya pasó su propio flujo de verificación (user.emailVerified)
    // Así evitamos el error OAuthAccountNotLinked sin usar allowDangerousEmailAccountLinking,
    // que vincularía sin exigir ninguna de las dos verificaciones.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || account.type !== "oauth") return true;

      const email = user.email;
      const googleVerifiedEmail = (profile as { email_verified?: boolean } | undefined)?.email_verified;
      if (!email || !googleVerifiedEmail) return true;

      const existing = await prisma.user.findUnique({
        where: { email },
        include: { accounts: { select: { provider: true } } },
      });
      if (!existing || !existing.emailVerified) return true;
      if (existing.accounts.some((a) => a.provider === "google")) return true;

      await prisma.account.create({
        data: {
          userId:            existing.id,
          type:              account.type,
          provider:          account.provider,
          providerAccountId: account.providerAccountId,
          access_token:      account.access_token,
          refresh_token:     account.refresh_token,
          expires_at:        account.expires_at,
          token_type:        account.token_type,
          scope:             account.scope,
          id_token:          account.id_token,
        },
      });

      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
