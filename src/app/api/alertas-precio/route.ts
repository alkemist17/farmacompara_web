import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ alerta: null });

  const productoId = Number(req.nextUrl.searchParams.get("productoId"));
  if (!productoId) return NextResponse.json({ error: "productoId requerido" }, { status: 400 });

  const alerta = await prisma.alertas_precio.findUnique({
    where: { usuario_id_producto_id: { usuario_id: session.user.id, producto_id: productoId } },
    select: { tipo: true, precio_objetivo: true, activa: true },
  });

  return NextResponse.json({
    alerta: alerta
      ? { tipo: alerta.tipo, precio_objetivo: alerta.precio_objetivo?.toNumber() ?? null, activa: alerta.activa }
      : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const productoId = Number(body.productoId);
  const tipo: string = body.tipo ?? "cualquier_bajada";
  const precioObjetivo: number | null = body.precioObjetivo ? Number(body.precioObjetivo) : null;

  if (!productoId) return NextResponse.json({ error: "productoId requerido" }, { status: 400 });
  if (tipo === "precio_objetivo" && !precioObjetivo) {
    return NextResponse.json({ error: "Precio objetivo requerido" }, { status: 400 });
  }

  const alerta = await prisma.alertas_precio.upsert({
    where: { usuario_id_producto_id: { usuario_id: session.user.id, producto_id: productoId } },
    create: {
      usuario_id: session.user.id,
      producto_id: productoId,
      tipo,
      precio_objetivo: precioObjetivo,
      activa: true,
    },
    update: {
      tipo,
      precio_objetivo: precioObjetivo,
      activa: true,
    },
    select: { tipo: true, precio_objetivo: true, activa: true },
  });

  return NextResponse.json({
    alerta: { tipo: alerta.tipo, precio_objetivo: alerta.precio_objetivo?.toNumber() ?? null, activa: alerta.activa },
  });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const productoId = Number(body.productoId);
  if (!productoId) return NextResponse.json({ error: "productoId requerido" }, { status: 400 });

  await prisma.alertas_precio.deleteMany({
    where: { usuario_id: session.user.id, producto_id: productoId },
  });

  return NextResponse.json({ ok: true });
}
