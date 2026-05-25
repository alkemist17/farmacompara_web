import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIPOS_VALIDOS = new Set([
  "ayudo_ahorro",
  "precio_en_tienda",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ean, tipo, respuesta, notas } = body;

    if (!ean || !tipo || typeof respuesta !== "boolean") {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    if (!TIPOS_VALIDOS.has(tipo)) {
      return NextResponse.json({ error: "Tipo desconocido" }, { status: 400 });
    }

    await prisma.feedback_comparacion.create({
      data: { ean, tipo, respuesta, notas: notas ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/feedback]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
