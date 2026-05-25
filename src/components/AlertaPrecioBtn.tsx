"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellOff, BellRing, Loader2, X, Check, TrendingDown, Target } from "lucide-react";
import AuthModal from "@/components/AuthModal";

interface AlertaState {
  tipo: "cualquier_bajada" | "precio_objetivo";
  precio_objetivo: number | null;
  activa: boolean;
}

interface Props {
  productoId: number;
  nombreProducto: string;
  initialAlerta?: AlertaState | null;
}

export default function AlertaPrecioBtn({ productoId, nombreProducto, initialAlerta = null }: Props) {
  const { data: session, status } = useSession();
  const [alerta, setAlerta]       = useState<AlertaState | null>(initialAlerta);
  const [modalOpen, setModalOpen] = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [tipo, setTipo]           = useState<"cualquier_bajada" | "precio_objetivo">(
    initialAlerta?.tipo ?? "cualquier_bajada"
  );
  const [precioInput, setPrecioInput] = useState(
    initialAlerta?.precio_objetivo ? String(initialAlerta.precio_objetivo) : ""
  );
  const [error, setError]   = useState("");
  const [toast, setToast]   = useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" });
  const inputRef   = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, msg });
    timerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }

  useEffect(() => {
    if (modalOpen && tipo === "precio_objetivo") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [modalOpen, tipo]);

  // After login, auto-open the alert modal to continue the pending action
  useEffect(() => {
    if (status !== "authenticated" || !pendingRef.current) return;
    pendingRef.current = false;
    setError("");
    setModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function openModal() {
    if (status === "loading") return;
    if (!session?.user) {
      pendingRef.current = true;
      setAuthOpen(true);
      return;
    }
    if (alerta) {
      setTipo(alerta.tipo);
      setPrecioInput(alerta.precio_objetivo ? String(alerta.precio_objetivo) : "");
    }
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (tipo === "precio_objetivo") {
      const val = parseFloat(precioInput.replace(/\./g, "").replace(",", "."));
      if (!val || val <= 0) {
        setError("Ingresa un precio mayor a $0");
        return;
      }
    }

    setLoading(true);
    try {
      const precioObjetivo = tipo === "precio_objetivo"
        ? parseFloat(precioInput.replace(/\./g, "").replace(",", "."))
        : null;

      const res = await fetch("/api/alertas-precio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId, tipo, precioObjetivo }),
      });

      if (res.ok) {
        const data = await res.json();
        const wasActiva = isActiva;
        setAlerta(data.alerta);
        setModalOpen(false);
        showToast(wasActiva ? "Alerta actualizada" : "Alerta activada");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDesactivar() {
    setLoading(true);
    try {
      const res = await fetch("/api/alertas-precio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId }),
      });
      if (res.ok) {
        setAlerta(null);
        setModalOpen(false);
        showToast("Alerta eliminada");
      }
    } finally {
      setLoading(false);
    }
  }

  const isActiva = alerta?.activa === true;

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={openModal}
          disabled={status === "loading"}
          className={`w-full flex items-center justify-center gap-2 border font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors
            ${isActiva
              ? "border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
              : "border-primary-500 text-primary-600 hover:bg-primary-50"
            }
            disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isActiva ? (
            <><BellRing className="w-4 h-4" /> Alerta activa</>
          ) : (
            <><Bell className="w-4 h-4" /> Activar alerta de precio</>
          )}
        </button>

        {/* Toast */}
        <div
          className={`absolute top-full left-0 right-0 mt-1.5 z-20 flex items-center justify-center gap-1.5
            px-3 py-2 rounded-xl shadow-md border text-xs font-semibold
            bg-primary-50 border-primary-200 text-primary-700
            transition-all duration-300
            ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
          aria-live="polite"
        >
          <BellRing className="w-3.5 h-3.5 shrink-0" />
          {toast.msg}
        </div>
      </div>

      {/* Auth modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab="login"
        mensaje="Inicia sesión o crea una cuenta para recibir alertas cuando este producto baje de precio."
      />

      {/* Alert modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} aria-hidden />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary-50 rounded-xl">
                  <Bell className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Alerta de precio</p>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{nombreProducto}</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Option 1 */}
              <label className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-colors
                ${tipo === "cualquier_bajada" ? "border-primary-400 bg-primary-50" : "border-gray-100 hover:border-gray-200"}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="cualquier_bajada"
                  checked={tipo === "cualquier_bajada"}
                  onChange={() => { setTipo("cualquier_bajada"); setError(""); }}
                  className="mt-0.5 accent-primary-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-semibold text-gray-800">Cualquier bajada</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Te avisamos cuando el precio baje, sin importar cuánto.</p>
                </div>
              </label>

              {/* Option 2 */}
              <label className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-colors
                ${tipo === "precio_objetivo" ? "border-primary-400 bg-primary-50" : "border-gray-100 hover:border-gray-200"}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="precio_objetivo"
                  checked={tipo === "precio_objetivo"}
                  onChange={() => { setTipo("precio_objetivo"); setError(""); }}
                  className="mt-0.5 accent-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-semibold text-gray-800">Precio objetivo</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Te avisamos cuando baje del precio que indiques.</p>
                  {tipo === "precio_objetivo" && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-gray-500 shrink-0">$</span>
                      <input
                        ref={inputRef}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ej: 15000"
                        value={precioInput}
                        onChange={(e) => { setPrecioInput(e.target.value); setError(""); }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-400 shrink-0">COP</span>
                    </div>
                  )}
                </div>
              </label>

              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                {isActiva && (
                  <button
                    type="button"
                    onClick={handleDesactivar}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 font-medium transition-colors disabled:opacity-50"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    Desactivar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : (
                    <><Check className="w-4 h-4" /> {isActiva ? "Actualizar alerta" : "Activar alerta"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
