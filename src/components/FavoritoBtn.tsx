"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Heart, Loader2, HeartOff, HeartHandshake } from "lucide-react";
import AuthModal from "@/components/AuthModal";

interface Props {
  productoId: number;
  initialFavorito?: boolean;
}

type ToastState = { visible: boolean; added: boolean };

export default function FavoritoBtn({ productoId, initialFavorito = false }: Props) {
  const { data: session, status } = useSession();
  const [favorito, setFavorito]   = useState(initialFavorito);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast]         = useState<ToastState>({ visible: false, added: false });
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef                = useRef(false);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // After login, auto-complete the pending "add to favorites" action
  useEffect(() => {
    if (status !== "authenticated" || !pendingRef.current) return;
    pendingRef.current = false;
    setLoading(true);
    fetch("/api/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productoId }),
    })
      .then((res) => { if (res.ok) { setFavorito(true); showToast(true); } })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function showToast(added: boolean) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, added });
    timerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }

  async function toggle() {
    if (status === "loading") return;

    if (!session?.user) {
      pendingRef.current = true;
      setModalOpen(true);
      return;
    }

    setLoading(true);
    const adding = !favorito;
    try {
      const res = await fetch("/api/favoritos", {
        method: adding ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId }),
      });
      if (res.ok) {
        setFavorito(adding);
        showToast(adding);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={loading || status === "loading"}
        title={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
        className={`absolute top-3 right-3 z-10 p-2.5 rounded-full border shadow-sm transition-all duration-200
          ${favorito
            ? "bg-red-50 border-red-300 text-red-500 scale-110"
            : "bg-white/80 hover:bg-white border-gray-200 text-gray-300 hover:text-red-400"
          }
          disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-red-400" />
        ) : (
          <Heart className={`w-6 h-6 transition-all duration-200 ${favorito ? "fill-red-500 stroke-red-500" : ""}`} />
        )}
      </button>

      {/* Toast */}
      <div
        className={`absolute top-14 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-sm font-medium
          transition-all duration-300
          ${toast.added
            ? "bg-red-50 border-red-200 text-red-600"
            : "bg-gray-50 border-gray-200 text-gray-500"
          }
          ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
        aria-live="polite"
      >
        {toast.added
          ? <><HeartHandshake className="w-4 h-4 shrink-0" /> Guardado en favoritos</>
          : <><HeartOff className="w-4 h-4 shrink-0" /> Eliminado de favoritos</>
        }
      </div>

      <AuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab="login"
        mensaje="Para guardar este producto en tus favoritos inicia sesión o crea una cuenta gratis."
      />
    </>
  );
}
