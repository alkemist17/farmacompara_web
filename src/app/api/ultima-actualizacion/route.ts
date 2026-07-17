import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await prisma.precios.findFirst({
    where: { fuentes: { tipo: "retail" } },
    orderBy: { fecha_revision: "desc" },
    select: { fecha_revision: true },
  });

  return NextResponse.json({
    fecha: result?.fecha_revision ?? null,
  });
}
