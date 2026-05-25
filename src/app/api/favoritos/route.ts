import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/favoritos?productoId=X → { favorito: boolean }
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ favorito: false });

  const productoId = parseInt(req.nextUrl.searchParams.get("productoId") ?? "", 10);
  if (!productoId) return NextResponse.json({ favorito: false });

  const existe = await prisma.favoritos.findUnique({
    where: { usuario_id_producto_id: { usuario_id: session.user.id, producto_id: productoId } },
    select: { id: true },
  });

  return NextResponse.json({ favorito: existe !== null });
}

// POST /api/favoritos { productoId } → { favorito: true }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { productoId } = await req.json();
  if (!Number.isInteger(productoId) || productoId <= 0) {
    return NextResponse.json({ error: "productoId inválido" }, { status: 400 });
  }

  await prisma.favoritos.upsert({
    where: { usuario_id_producto_id: { usuario_id: session.user.id, producto_id: productoId } },
    create: { usuario_id: session.user.id, producto_id: productoId },
    update: {},
  });

  return NextResponse.json({ favorito: true });
}

// DELETE /api/favoritos { productoId } → { favorito: false }
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { productoId } = await req.json();
  if (!Number.isInteger(productoId) || productoId <= 0) {
    return NextResponse.json({ error: "productoId inválido" }, { status: 400 });
  }

  await prisma.favoritos.deleteMany({
    where: { usuario_id: session.user.id, producto_id: productoId },
  });

  return NextResponse.json({ favorito: false });
}
