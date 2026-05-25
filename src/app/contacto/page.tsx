"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, CheckCircle2, Clock } from "lucide-react";

type Estado = "idle" | "enviando" | "ok" | "error";

export default function ContactoPage() {
  const [nombre, setNombre]   = useState("");
  const [correo, setCorreo]   = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado]   = useState<Estado>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, mensaje }),
      });
      setEstado(res.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  }

  function resetForm() {
    setEstado("idle");
    setNombre("");
    setCorreo("");
    setMensaje("");
  }

  return (
    <>
      {/* ── Cabecera ─────────────────────────────────────────── */}
      <section className="bg-secondary-500 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors font-medium">Inicio</Link>
            <span>›</span>
            <span className="text-white/80">Contacto</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-primary-300 text-xs font-bold uppercase tracking-widest mb-1">Soporte</p>
              <h1 className="text-3xl font-extrabold text-white">Contáctanos</h1>
              <p className="text-white/50 text-sm mt-1">Estamos aquí para ayudarte</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contenido ────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Info rápida */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Correo</p>
              <a href="mailto:contacto@farmacompara.co" className="text-sm font-semibold text-primary-600 hover:underline">
                contacto@farmacompara.co
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Respuesta</p>
              <p className="text-sm font-semibold text-gray-700">Menos de 48 h hábiles</p>
            </div>
          </div>
        </div>

        {/* Formulario / Estado */}
        {estado === "ok" ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">¡Mensaje enviado!</h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
              Te responderemos al correo indicado en menos de 48 horas hábiles.
            </p>
            <button
              onClick={resetForm}
              className="mt-8 inline-flex items-center gap-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-600 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Encabezado del formulario */}
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Envíanos un mensaje</p>
              <p className="text-xs text-gray-400 mt-0.5">Todos los campos son obligatorios</p>
            </div>

            <div className="px-8 py-7 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2" htmlFor="correo">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2" htmlFor="mensaje">
                  Mensaje
                </label>
                <textarea
                  id="mensaje"
                  required
                  rows={5}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntanos en qué podemos ayudarte…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition resize-none"
                />
              </div>

              {estado === "error" && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600">
                    Ocurrió un error al enviar el mensaje. Intenta de nuevo o escríbenos a{" "}
                    <a href="mailto:contacto@farmacompara.co" className="font-semibold underline">
                      contacto@farmacompara.co
                    </a>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Footer del formulario */}
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-400 leading-snug hidden sm:block">
                Tu información no será compartida con terceros.
              </p>
              <button
                type="submit"
                disabled={estado === "enviando"}
                className="bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold px-7 py-2.5 rounded-xl transition-colors text-sm shrink-0 w-full sm:w-auto"
              >
                {estado === "enviando" ? "Enviando…" : "Enviar mensaje"}
              </button>
            </div>
          </form>
        )}

        {/* Enlace a FAQ */}
        <p className="text-center text-xs text-gray-400 mt-8">
          ¿Tienes una pregunta común?{" "}
          <Link href="/faq" className="text-primary-500 hover:underline font-medium">
            Revisa las preguntas frecuentes
          </Link>
        </p>
      </div>
    </>
  );
}
