import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE = (process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const base  = BASE || new URL("/", req.url).origin;

  if (!token) {
    return NextResponse.redirect(`${base}/verificar-email?error=invalid`);
  }

  try {
    const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

    if (!record) {
      return NextResponse.redirect(`${base}/verificar-email?error=invalid`);
    }
    if (record.expires < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { token } });
      return NextResponse.redirect(`${base}/verificar-email?error=expired&email=${encodeURIComponent(record.email)}`);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data:  { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.redirect(`${base}/login?verified=1`);
  } catch (err) {
    console.error("[verify-email]", err);
    return NextResponse.redirect(`${base}/verificar-email?error=server`);
  }
}
