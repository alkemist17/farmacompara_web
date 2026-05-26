"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ThumbsUp, ThumbsDown, Store, Sparkles } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import type { ReactNode } from "react";

type Estado = "idle" | "enviando" | "listo";

interface PreguntaProps {
  icono: ReactNode;
  pregunta: string;
  subtitulo: string;
  labelSi: string;
  labelNo: string;
  estado: Estado;
  respuesta: boolean | null;
  onResponder: (val: boolean) => void;
}

function Pregunta({ icono, pregunta, subtitulo, labelSi, labelNo, estado, respuesta, onResponder }: PreguntaProps) {
  const respondido = respuesta !== null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 px-5 py-4">
      {/* Icono alineado a los dos textos */}
      <div className="text-primary-500 shrink-0">{icono}</div>

      {/* Textos */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{pregunta}</p>
        <p className="text-xs text-gray-400 font-normal mt-0.5">{subtitulo}</p>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => !respondido && onResponder(true)}
          disabled={estado === "enviando" || respondido}
          className={[
            "inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all",
            respondido && respuesta === true
              ? "bg-primary-500 border-primary-500 text-white scale-105 shadow-sm"
              : respondido
              ? "bg-gray-100 border-gray-200 text-gray-300 cursor-default"
              : "bg-primary-500 border-primary-500 text-white hover:bg-primary-600 hover:border-primary-600 hover:scale-105 active:scale-95",
          ].join(" ")}
        >
          <ThumbsUp className="w-3 h-3" />
          {labelSi}
        </button>
        <button
          onClick={() => !respondido && onResponder(false)}
          disabled={estado === "enviando" || respondido}
          className={[
            "inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all",
            respondido && respuesta === false
              ? "bg-gray-800 border-gray-800 text-white scale-105 shadow-sm"
              : respondido
              ? "bg-gray-100 border-gray-200 text-gray-300 cursor-default"
              : "bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:scale-105 active:scale-95",
          ].join(" ")}
        >
          <ThumbsDown className="w-3 h-3" />
          {labelNo}
        </button>
      </div>
    </div>
  );
}

export default function FeedbackBar({ ean }: { ean: string }) {
  const { data: session, status } = useSession();
  const [estadoAhorro, setEstadoAhorro] = useState<Estado>("idle");
  const [estadoTienda, setEstadoTienda] = useState<Estado>("idle");
  const [respAhorro,   setRespAhorro]   = useState<boolean | null>(null);
  const [respTienda,   setRespTienda]   = useState<boolean | null>(null);
  const [authOpen,     setAuthOpen]     = useState(false);

  async function enviar(tipo: "ayudo_ahorro" | "precio_en_tienda", respuesta: boolean) {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setAuthOpen(true);
      return;
    }

    const setEstado = tipo === "ayudo_ahorro" ? setEstadoAhorro : setEstadoTienda;
    const setResp   = tipo === "ayudo_ahorro" ? setRespAhorro   : setRespTienda;

    setEstado("enviando");
    setResp(respuesta);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ean, tipo, respuesta }),
      });

      if (res.status === 401) {
        setEstado("idle");
        setResp(null);
        setAuthOpen(true);
        return;
      }

      // 200 ok o 409 ya_respondido: marcar como respondido
      setEstado("listo");
    } catch {
      // silencioso — no bloquear UX por error de red
      setEstado("listo");
    }
  }

  return (
    <>
      <div className="bg-white border-2 border-dashed border-primary-400 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row">

          <Pregunta
            icono={<Sparkles className="w-8 h-8" />}
            pregunta="¿Te ayudó esta comparación a ahorrar?"
            subtitulo="Tu opinión nos ayuda a mejorar"
            labelSi="Sí, me ayudó"
            labelNo="No mucho"
            estado={estadoAhorro}
            respuesta={respAhorro}
            onResponder={(v) => enviar("ayudo_ahorro", v)}
          />

          {/* Separador — con padding vertical para que no llegue de punta a punta */}
          <div className="hidden sm:flex items-stretch py-4">
            <div className="w-px bg-gray-200" />
          </div>
          <div className="sm:hidden mx-6 h-px bg-gray-200" />

          <Pregunta
            icono={<Store className="w-8 h-8" />}
            pregunta="¿Encontraste este precio en tienda?"
            subtitulo="Confírmalo y ayúdanos a mantener los precios actualizados"
            labelSi="Sí"
            labelNo="No"
            estado={estadoTienda}
            respuesta={respTienda}
            onResponder={(v) => enviar("precio_en_tienda", v)}
          />

        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        mensaje="Inicia sesión para enviar tu opinión y ayudarnos a mejorar"
      />
    </>
  );
}
