import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  const result = await prisma.precios.findFirst({
    orderBy: { fecha_revision: "desc" },
    select: { fecha_revision: true },
  });

  return NextResponse.json({
    fecha: result?.fecha_revision ?? null,
  });
}
