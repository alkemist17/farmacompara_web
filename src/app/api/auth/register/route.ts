import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { isRateLimited, getIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (isRateLimited(`register:${getIp(req)}`, { max: 5, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta en 15 minutos." }, { status: 429 });
  }

  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const normalizedEmail = (email as string).toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { name: name?.trim() || null, email: normalizedEmail, password: hashed },
    });

    // Enviar email de verificación
    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    await prisma.emailVerificationToken.create({ data: { email: normalizedEmail, token, expires } });
    await sendVerificationEmail(normalizedEmail, token);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
