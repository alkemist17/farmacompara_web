"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart, Bell, Package, Trash2, ExternalLink,
  TrendingDown, Target, BellOff, HeartOff,
} from "lucide-react";
import { formatCOP } from "@/lib/format";

interface Favorito {
  favorito_id: number;
  producto_id: number;
  slug: string;
  nombre: string;
  laboratorio: string | null;
  ean: string | null;
  imagen_url: string | null;
  precio_min: number | null;
}

interface Alerta {
  id: number;
  producto_id: number;
  tipo: "cualquier_bajada" | "precio_objetivo";
  precio_objetivo: number | null;
  activa: boolean;
  producto: {
    slug: string;
    nombre: string;
    laboratorio: string | null;
    ean: string | null;
  };
}

interface Props {
  displayName: string;
  favoritos: Favorito[];
  alertas: Alerta[];
}

type Tab = "favoritos" | "alertas";

export default function PerfilContent({ displayName: _displayName, favoritos: initialFavoritos, alertas: initialAlertas }: Props) {
  const [tab, setTab]           = useState<Tab>("favoritos");
  const [favoritos, setFavoritos] = useState(initialFavoritos);
  const [alertas, setAlertas]     = useState(initialAlertas);
  const [removingFav, setRemovingFav]     = useState<number | null>(null);
  const [removingAlerta, setRemovingAlerta] = useState<number | null>(null);

  async function removeFavorito(productoId: number) {
    setRemovingFav(productoId);
    try {
      const res = await fetch("/api/favoritos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId }),
      });
      if (res.ok) setFavoritos((prev) => prev.filter((f) => f.producto_id !== productoId));
    } finally {
      setRemovingFav(null);
    }
  }

  async function removeAlerta(productoId: number) {
    setRemovingAlerta(productoId);
    try {
      const res = await fetch("/api/alertas-precio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId }),
      });
      if (res.ok) setAlertas((prev) => prev.filter((a) => a.producto_id !== productoId));
    } finally {
      setRemovingAlerta(null);
    }
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <TabBtn active={tab === "favoritos"} onClick={() => setTab("favoritos")} count={favoritos.length}>
          <Heart className="w-4 h-4" />
          Mis favoritos
        </TabBtn>
        <TabBtn active={tab === "alertas"} onClick={() => setTab("alertas")} count={alertas.length}>
          <Bell className="w-4 h-4" />
          Mis alertas
        </TabBtn>
      </div>

      {/* Favoritos */}
      {tab === "favoritos" && (
        <div className="space-y-3">
          {favoritos.length === 0 ? (
            <EmptyState
              icon={<HeartOff className="w-10 h-10 text-gray-200" />}
              title="Sin favoritos aún"
              text="Guarda productos para verlos aquí fácilmente."
            />
          ) : (
            favoritos.map((f) => (
              <ProductCard
                key={f.favorito_id}
                slug={f.slug}
                nombre={f.nombre}
                laboratorio={f.laboratorio}
                imagenUrl={f.imagen_url}
                removing={removingFav === f.producto_id}
                onRemove={() => removeFavorito(f.producto_id)}
                removeLabel="Quitar favorito"
              >
                {f.precio_min != null ? (
                  <span className="text-sm font-bold text-primary-600">
                    {formatCOP(f.precio_min)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Sin precio disponible</span>
                )}
              </ProductCard>
            ))
          )}
        </div>
      )}

      {/* Alertas */}
      {tab === "alertas" && (
        <div className="space-y-3">
          {alertas.length === 0 ? (
            <EmptyState
              icon={<BellOff className="w-10 h-10 text-gray-200" />}
              title="Sin alertas configuradas"
              text="Activa alertas en la página de un producto para recibir notificaciones de precio."
            />
          ) : (
            alertas.map((a) => (
              <ProductCard
                key={a.id}
                slug={a.producto.slug}
                nombre={a.producto.nombre}
                laboratorio={a.producto.laboratorio}
                imagenUrl={a.producto.ean ? `/api/imagen/${a.producto.ean}` : null}
                removing={removingAlerta === a.producto_id}
                onRemove={() => removeAlerta(a.producto_id)}
                removeLabel="Eliminar alerta"
              >
                <AlertaBadge tipo={a.tipo} precioObjetivo={a.precio_objetivo} activa={a.activa} />
              </ProductCard>
            ))
          )}
        </div>
      )}
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function TabBtn({
  active, onClick, count, children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors
        ${active
          ? "border-primary-500 text-primary-600"
          : "border-transparent text-gray-400 hover:text-gray-600"
        }`}
    >
      {children}
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
        ${active ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"}`}>
        {count}
      </span>
    </button>
  );
}

function ProductCard({
  slug, nombre, laboratorio, imagenUrl, removing, onRemove, removeLabel, children,
}: {
  slug: string;
  nombre: string;
  laboratorio: string | null;
  imagenUrl: string | null;
  removing: boolean;
  onRemove: () => void;
  removeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm
      transition-all duration-200 ${removing ? "opacity-40 scale-98 pointer-events-none" : ""}`}>

      {/* Imagen */}
      <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
        {imagenUrl ? (
          <Image src={imagenUrl} alt={nombre} width={56} height={56} className="object-contain w-full h-full p-1" unoptimized />
        ) : (
          <Package className="w-6 h-6 text-gray-200" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{nombre}</p>
        {laboratorio && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{laboratorio}</p>
        )}
        <div className="mt-1.5">{children}</div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/producto/${slug}`}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold hover:underline"
        >
          Ver
          <ExternalLink className="w-3 h-3" />
        </Link>
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          title={removeLabel}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AlertaBadge({
  tipo, precioObjetivo, activa,
}: {
  tipo: "cualquier_bajada" | "precio_objetivo";
  precioObjetivo: number | null;
  activa: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {tipo === "cualquier_bajada" ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
          <TrendingDown className="w-3 h-3" />
          Cualquier bajada
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">
          <Target className="w-3 h-3" />
          Baja de {formatCOP(precioObjetivo)}
        </span>
      )}
      {!activa && (
        <span className="text-xs text-gray-400 font-medium">· Inactiva</span>
      )}
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="mt-4 text-base font-semibold text-gray-500">{title}</p>
      <p className="mt-1 text-sm text-gray-400 max-w-xs">{text}</p>
    </div>
  );
}
