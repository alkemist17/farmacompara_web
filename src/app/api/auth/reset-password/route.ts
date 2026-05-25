import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "El enlace expiró o no es válido. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data:  { password: hashed },
      }),
      prisma.passwordResetToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
