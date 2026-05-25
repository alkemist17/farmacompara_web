"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

export default function RecuperarContrasenaPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          {sent ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-primary-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Si el correo <strong>{email}</strong> está registrado, recibirás un enlace
                para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                ¿No llegó? Revisa la carpeta de spam o espera unos minutos.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 font-semibold hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
                Olvidé mi contraseña
              </h1>
              <p className="text-sm text-gray-500 text-center mb-8">
                Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar enlace de recuperación"
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-primary-600 font-semibold hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
