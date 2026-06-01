"use client";

import { useEffect, useState } from "react";

function tiempoRelativo(fecha: string): string {
  const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (diff < 60)  return "hace un momento";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `hace ${m} ${m === 1 ? "minuto" : "minutos"}`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `hace ${h} ${h === 1 ? "hora" : "horas"}`;
  }
  const d = Math.floor(diff / 86400);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

export default function UltimaActualizacion() {
  const [texto, setTexto] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ultima-actualizacion")
      .then((r) => r.json())
      .then(({ fecha }) => {
        if (fecha) setTexto(tiempoRelativo(fecha));
      })
      .catch(() => {});

    const id = setInterval(() => {
      fetch("/api/ultima-actualizacion")
        .then((r) => r.json())
        .then(({ fecha }) => { if (fecha) setTexto(tiempoRelativo(fecha)); })
        .catch(() => {});
    }, 60_000);

    return () => clearInterval(id);
  }, []);

  if (!texto) return null;

  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span>Última actualización: {texto}</span>
    </span>
  );
}
