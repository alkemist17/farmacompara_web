import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const producto_id = Number(body?.producto_id);

    if (!Number.isInteger(producto_id) || producto_id <= 0) {
      return new NextResponse(null, { status: 204 });
    }

    await prisma.$queryRawUnsafe(
      `INSERT INTO product_trends (producto_id, semana, clics)
       VALUES ($1, date_trunc('week', NOW())::date, 1)
       ON CONFLICT (producto_id, semana)
       DO UPDATE SET clics = product_trends.clics + 1`,
      producto_id
    );
  } catch {
    // Nunca fallar al cliente — el tracking es secundario
  }

  return new NextResponse(null, { status: 204 });
}
