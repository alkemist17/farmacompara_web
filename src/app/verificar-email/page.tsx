"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Logo from "@/components/Logo";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const errorParam   = searchParams.get("error");
  const emailParam   = searchParams.get("email") ?? "";

  const [email,   setEmail]   = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
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

  if (sent) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-primary-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Correo enviado</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Si el correo <strong>{email}</strong> está pendiente de verificación,
          recibirás un nuevo enlace en los próximos minutos.
        </p>
        <Link href="/login" className="text-sm text-primary-600 font-semibold hover:underline">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  // Error: enlace expirado
  if (errorParam === "expired") {
    return (
      <>
        <div className="flex items-center justify-center w-14 h-14 bg-amber-50 rounded-full mx-auto mb-4">
          <Clock className="w-7 h-7 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Enlace expirado</h1>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
          Este enlace de verificación ya expiró (válido por 24 horas).
          Solicita uno nuevo:
        </p>
        <ResendForm
          email={email}
          setEmail={setEmail}
          loading={loading}
          error={error}
          onSubmit={handleResend}
        />
      </>
    );
  }

  // Error: enlace inválido o genérico
  if (errorParam === "invalid" || errorParam === "server") {
    return (
      <>
        <div className="flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
          Enlace no válido
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
          Este enlace de verificación no es válido o ya fue usado.
          Solicita uno nuevo:
        </p>
        <ResendForm
          email={email}
          setEmail={setEmail}
          loading={loading}
          error={error}
          onSubmit={handleResend}
        />
      </>
    );
  }

  // Estado inicial: página para reenviar sin error (desde el login)
  return (
    <>
      <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mx-auto mb-4">
        <Mail className="w-7 h-7 text-blue-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
        Verifica tu correo
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
        ¿No recibiste el correo de verificación? Ingresa tu email y te enviamos uno nuevo.
      </p>
      <ResendForm
        email={email}
        setEmail={setEmail}
        loading={loading}
        error={error}
        onSubmit={handleResend}
      />
    </>
  );
}

function ResendForm({
  email, setEmail, loading, error, onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
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
          "Reenviar correo de verificación"
        )}
      </button>
      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-primary-600 font-semibold hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}

export default function VerificarEmailPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <Suspense>
            <VerificarEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
