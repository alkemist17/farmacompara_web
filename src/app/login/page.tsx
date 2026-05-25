"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import Logo from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const registered = params.get("registered");
  const verified   = params.get("verified");
  const verify     = params.get("verify"); // recién registrado, pendiente de verificar

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showVerifyHint, setShowVerifyHint] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowVerifyHint(false);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email o contraseña incorrectos.");
      setShowVerifyHint(true);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
        Bienvenido de vuelta
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Inicia sesión para guardar tus favoritos y alertas
      </p>

      {/* Cuenta creada — pendiente de verificación */}
      {verify && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-6">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Cuenta creada. <strong>Revisa tu correo</strong> y haz clic en el enlace de verificación para activar tu cuenta.
          </span>
        </div>
      )}

      {/* Email verificado exitosamente */}
      {verified && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Correo verificado exitosamente. Ya puedes iniciar sesión.
        </div>
      )}

      {/* Registro exitoso (sin verificación) */}
      {registered && !verify && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Cuenta creada exitosamente.
        </div>
      )}

      {/* Error de credenciales */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
          {showVerifyHint && (
            <p className="text-xs text-red-600 pl-6">
              ¿Te registraste recientemente?{" "}
              <Link href="/verificar-email" className="font-semibold underline">
                Verifica tu correo electrónico
              </Link>
            </p>
          )}
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <Link
              href="/recuperar-contrasena"
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              Iniciando sesión...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-primary-600 font-semibold hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
