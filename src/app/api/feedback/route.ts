import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TIPOS_VALIDOS = new Set([
  "ayudo_ahorro",
  "precio_en_tienda",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "no_autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ean, tipo, respuesta, notas } = body;

    if (!ean || !tipo || typeof respuesta !== "boolean") {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    if (!TIPOS_VALIDOS.has(tipo)) {
      return NextResponse.json({ error: "Tipo desconocido" }, { status: 400 });
    }

    const startOfDayUTC = new Date();
    startOfDayUTC.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.feedback_comparacion.findFirst({
      where: {
        user_id: session.user.id,
        ean,
        tipo,
        fecha: { gte: startOfDayUTC },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ ya_respondido: true, tipo }, { status: 409 });
    }

    await prisma.feedback_comparacion.create({
      data: { user_id: session.user.id, ean, tipo, respuesta, notas: notas ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/feedback]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
