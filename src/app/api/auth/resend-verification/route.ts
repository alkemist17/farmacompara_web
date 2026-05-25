import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Si el usuario no existe o ya está verificado, devolver ok igualmente
    if (user && !user.emailVerified) {
      await prisma.emailVerificationToken.deleteMany({ where: { email: user.email } });

      const token   = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      await prisma.emailVerificationToken.create({ data: { email: user.email, token, expires } });
      await sendVerificationEmail(user.email, token);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
