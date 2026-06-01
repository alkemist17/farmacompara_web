import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PerfilContent from "@/components/PerfilContent";

export const metadata: Metadata = {
  title: "Mi perfil — MedioFertas",
};

interface FavoritoRow {
  favorito_id: number;
  producto_id: number;
  slug: string;
  nombre: string;
  laboratorio: string | null;
  ean: string | null;
  imagen_url: string | null;
  precio_min: number | null;
}

const SQL_FAVORITOS = `
  WITH producto_ean AS (
    SELECT DISTINCT ON (cb.producto_id)
      cb.producto_id,
      cb.ean
    FROM codigos_barras cb
    ORDER BY cb.producto_id
  ),
  precio_min AS (
    SELECT
      cb.producto_id,
      MIN(COALESCE(p.precio_oferta, p.precio_costo))::float AS precio_min
    FROM precios p
    JOIN codigos_barras cb ON cb.ean = p.ean
    GROUP BY cb.producto_id
  )
  SELECT
    f.id::int              AS favorito_id,
    mp.id                  AS producto_id,
    mp.slug,
    mp.nombre,
    mp.laboratorio,
    pe.ean,
    CASE WHEN pe.ean IS NOT NULL
      THEN '/api/imagen/' || pe.ean
      ELSE NULL
    END AS imagen_url,
    pm.precio_min
  FROM favoritos f
  JOIN maestro_productos mp ON mp.id = f.producto_id
  LEFT JOIN producto_ean pe ON pe.producto_id = mp.id
  LEFT JOIN precio_min pm ON pm.producto_id = mp.id
  WHERE f.usuario_id = $1
  ORDER BY f.created_at DESC
`;

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;
  const displayName = session.user.name || session.user.email?.split("@")[0] || "Usuario";

  const [favoritos, alertasRaw] = await Promise.all([
    prisma.$queryRawUnsafe<FavoritoRow[]>(SQL_FAVORITOS, userId),
    prisma.alertas_precio.findMany({
      where: { usuario_id: userId },
      select: {
        id: true,
        producto_id: true,
        tipo: true,
        precio_objetivo: true,
        activa: true,
        producto: {
          select: {
            slug: true,
            nombre: true,
            laboratorio: true,
            codigos_barras: { select: { ean: true }, take: 1 },
          },
        },
      },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const alertas = alertasRaw.map((a) => ({
    id: Number(a.id),
    producto_id: a.producto_id,
    tipo: a.tipo as "cualquier_bajada" | "precio_objetivo",
    precio_objetivo: a.precio_objetivo?.toNumber() ?? null,
    activa: a.activa,
    producto: {
      slug: a.producto.slug,
      nombre: a.producto.nombre,
      laboratorio: a.producto.laboratorio,
      ean: a.producto.codigos_barras[0]?.ean ?? null,
    },
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-500">Mi perfil</h1>
        <p className="text-sm text-gray-400 mt-1">{session.user.email}</p>
      </div>

      <PerfilContent
        displayName={displayName}
        favoritos={favoritos}
        alertas={alertas}
      />
    </div>
  );
}
