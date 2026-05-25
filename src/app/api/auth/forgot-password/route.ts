import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { isRateLimited, getIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (isRateLimited(`forgot:${getIp(req)}`, { max: 3, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta en 15 minutos." }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { email: user.email } });

      const token   = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await prisma.passwordResetToken.create({ data: { email: user.email, token, expires } });
      await sendPasswordResetEmail(user.email, token);
    }

    // Siempre el mismo mensaje: no revelar si el email existe
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
