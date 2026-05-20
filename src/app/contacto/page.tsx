"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, CheckCircle2 } from "lucide-react";

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-primary-500 transition-colors font-medium">Inicio</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">Contacto</span>
      </nav>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-secondary-500 mb-2">Contáctanos</h1>
        <p className="text-gray-500 text-sm">Estamos aquí para ayudarte. Responderemos en menos de 48 horas.</p>
      </div>

      {/* Info rápida */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="flex-1 flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Correo electrónico</p>
            <a href="mailto:info@farmacompara.co" className="text-sm text-primary-500 hover:underline">
              info@farmacompara.co
            </a>
          </div>
        </div>
        <div className="flex-1 flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Tiempo de respuesta</p>
            <p className="text-sm text-gray-400">Menos de 48 horas hábiles</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {estado === "ok" ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <CheckCircle2 className="w-14 h-14 text-primary-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">¡Mensaje enviado!</h2>
          <p className="text-sm text-gray-400">Te responderemos al correo indicado en menos de 48 horas.</p>
          <button
            onClick={() => { setEstado("idle"); setNombre(""); setCorreo(""); setMensaje(""); }}
            className="mt-6 text-sm text-primary-500 hover:underline"
          >
            Enviar otro mensaje
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="correo">
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="mensaje">
              Mensaje
            </label>
            <textarea
              id="mensaje"
              required
              rows={5}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Cuéntanos en qué podemos ayudarte…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition resize-none"
            />
          </div>

          {estado === "error" && (
            <p className="text-sm text-red-500">
              Ocurrió un error al enviar el mensaje. Intenta de nuevo o escríbenos directamente a{" "}
              <a href="mailto:info@farmacompara.co" className="underline">info@farmacompara.co</a>.
            </p>
          )}

          <button
            type="submit"
            disabled={estado === "enviando"}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {estado === "enviando" ? "Enviando…" : "Enviar mensaje"}
          </button>
        </form>
      )}
    </div>
  );
}
