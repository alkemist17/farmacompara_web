import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, correo, mensaje } = body;

    if (!nombre || !correo || !mensaje) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (typeof correo !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    if (typeof mensaje !== "string" || mensaje.trim().length < 10) {
      return NextResponse.json({ error: "El mensaje es demasiado corto" }, { status: 400 });
    }

    console.info("[contacto]", { nombre, correo, mensaje: mensaje.slice(0, 80) });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/contacto]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
