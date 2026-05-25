"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  X, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2, Info, ArrowLeft,
} from "lucide-react";
import Logo from "@/components/Logo";

type View = "login" | "registro" | "recuperar";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "registro";
  mensaje?: string;
}

export default function AuthModal({ open, onClose, defaultTab = "login", mensaje }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>(defaultTab);

  // ── Login state ──────────────────────────────────────
  const [loginEmail,        setLoginEmail]        = useState("");
  const [loginPassword,     setLoginPassword]     = useState("");
  const [loginError,        setLoginError]        = useState("");
  const [loginLoading,      setLoginLoading]      = useState(false);
  const [showVerifyHint,    setShowVerifyHint]    = useState(false);

  // ── Register state ───────────────────────────────────
  const [regForm,    setRegForm]    = useState({ name: "", email: "", password: "", confirm: "" });
  const [regError,   setRegError]   = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // ── Recuperar contraseña state ───────────────────────
  const [recEmail,   setRecEmail]   = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [recSent,    setRecSent]    = useState(false);
  const [recError,   setRecError]   = useState("");

  // Sync view when prop changes
  useEffect(() => {
    if (open) {
      setView(defaultTab);
      setRecSent(false);
      setRecError("");
    }
  }, [open, defaultTab]);

  // Block body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);
  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setShowVerifyHint(false);
    setLoginLoading(true);

    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    setLoginLoading(false);
    if (res?.error) {
      setLoginError("Email o contraseña incorrectos.");
      setShowVerifyHint(true);
    } else {
      onClose();
      router.refresh();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (regForm.password !== regForm.confirm) {
      setRegError("Las contraseñas no coinciden");
      return;
    }
    if (regForm.password.length < 8) {
      setRegError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setRegLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: regForm.name, email: regForm.email, password: regForm.password }),
    });

    const data = await res.json();
    setRegLoading(false);

    if (!res.ok) {
      setRegError(data.error ?? "Error al crear la cuenta");
    } else {
      setRegSuccess("Cuenta creada. Revisa tu correo para verificarla.");
      setLoginEmail(regForm.email);
      setLoginPassword("");
      setView("login");
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecError("");
    setRecLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recEmail }),
      });
      if (!res.ok) throw new Error();
      setRecSent(true);
    } catch {
      setRecError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setRecLoading(false);
    }
  };

  if (!open) return null;

  const inputCls =
    "w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          {view === "recuperar" ? (
            <button
              onClick={() => { setView("login"); setRecSent(false); setRecError(""); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          ) : (
            <Logo size="sm" />
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje contextual opcional */}
        {mensaje && view !== "recuperar" && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 bg-primary-50 border border-primary-100 text-primary-700 text-sm rounded-xl px-3.5 py-3">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary-500" />
            <span>{mensaje}</span>
          </div>
        )}

        {/* Tabs — solo en login/registro */}
        {view !== "recuperar" && (
          <div className="flex mx-6 mt-5 border-b border-gray-100">
            {(["login", "registro"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setView(t)}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  view === t
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>
        )}

        {/* Contenido */}
        <div className="px-6 py-5">

          {/* ── LOGIN ───────────────────────────── */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {regSuccess && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-3 py-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  {regSuccess}
                </div>
              )}
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {loginError}
                  </div>
                  {showVerifyHint && (
                    <p className="text-xs text-red-600 pl-6">
                      ¿Te registraste recientemente?{" "}
                      <button
                        type="button"
                        onClick={() => { onClose(); window.location.assign("/verificar-email"); }}
                        className="font-semibold underline"
                      >
                        Verifica tu correo
                      </button>
                    </p>
                  )}
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="Correo electrónico"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setRecEmail(loginEmail); setView("recuperar"); }}
                    className="text-xs text-primary-600 hover:underline font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {loginLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</>
                  : "Iniciar sesión"}
              </button>

              <p className="text-center text-xs text-gray-500">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setView("registro")}
                  className="text-primary-600 font-semibold hover:underline"
                >
                  Regístrate gratis
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTRO ────────────────────────── */}
          {view === "registro" && (
            <form onSubmit={handleRegister} className="space-y-3">
              {regError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {regError}
                </div>
              )}

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre (opcional)"
                  value={regForm.name}
                  onChange={(e) => setRegForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="Correo electrónico"
                  value={regForm.email}
                  onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Contraseña (mín. 8 caracteres)"
                  value={regForm.password}
                  onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Confirmar contraseña"
                  value={regForm.confirm}
                  onChange={(e) => setRegForm((p) => ({ ...p, confirm: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {regLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                  : "Crear cuenta"}
              </button>

              <p className="text-center text-xs text-gray-500">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-primary-600 font-semibold hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          )}

          {/* ── RECUPERAR CONTRASEÑA ─────────────── */}
          {view === "recuperar" && (
            <div>
              {recSent ? (
                <div className="text-center py-2">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Revisa tu correo</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    Si <strong>{recEmail}</strong> está registrado, recibirás el enlace para restablecer tu contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setView("login"); setRecSent(false); }}
                    className="text-sm text-primary-600 font-semibold hover:underline"
                  >
                    Volver a iniciar sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecover} className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Recuperar contraseña</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
                    </p>
                  </div>

                  {recError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {recError}
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="Correo electrónico"
                      value={recEmail}
                      onChange={(e) => setRecEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={recLoading}
                    className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {recLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      : "Enviar enlace de recuperación"}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
