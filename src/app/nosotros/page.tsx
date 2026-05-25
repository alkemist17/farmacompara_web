import type { Metadata } from "next";
import Link from "next/link";
import { Heart, BarChart2, ShieldCheck, Zap, TrendingDown, Building2, Users } from "lucide-react";
import TrustBanner from "@/components/TrustBanner";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description: "Conoce la misión de FarmaCompara: ayudarte a encontrar los mejores precios de medicamentos en Colombia.",
  alternates: { canonical: "https://farmacompara.co/nosotros" },
  openGraph: {
    title: "Sobre nosotros — FarmaCompara",
    description: "Conoce la misión de FarmaCompara: ayudarte a encontrar los mejores precios de medicamentos en Colombia.",
    url: "https://farmacompara.co/nosotros",
    type: "website",
    siteName: "FarmaCompara",
  },
};

const VALORES = [
  {
    icon: Heart,
    titulo: "Compromiso con tu salud",
    texto: "Creemos que el acceso a medicamentos asequibles es un derecho, no un privilegio. Comparamos precios en tiempo real para que nunca pagues de más.",
  },
  {
    icon: BarChart2,
    titulo: "Transparencia total",
    texto: "Precios reales capturados directamente de las droguerías. Sin comisiones ocultas, sin precios inflados. Lo que ves es lo que pagas en tienda.",
  },
  {
    icon: Zap,
    titulo: "Información en tiempo real",
    texto: "Nuestros sistemas actualizan precios constantemente para darte siempre la información más reciente de cada droguería.",
  },
  {
    icon: ShieldCheck,
    titulo: "Privacidad ante todo",
    texto: "No vendemos tus datos. No necesitas registrarte para usar FarmaCompara. Buscas, comparas y ahorras, sin rastros.",
  },
];

const STATS = [
  { icon: TrendingDown, value: "Hasta 60%",  label: "de ahorro promedio",       color: "text-primary-300" },
  { icon: Building2,    value: "+80",         label: "droguerías comparadas",    color: "text-blue-300"    },
  { icon: Users,        value: "100%",        label: "gratuito y sin registro",  color: "text-accent-400"  },
];


export default function NosotrosPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient">
        {/* Dots decorativos */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Blur circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary-500/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 pt-6 pb-16 lg:pb-24">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-10">
            <Link href="/" className="hover:text-white transition-colors font-medium">Inicio</Link>
            <span>›</span>
            <span className="text-white/80">Sobre nosotros</span>
          </nav>

          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-accent-400 rounded-full" />
              Nuestra historia
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
              Tu ahorro,{" "}
              <span className="text-primary-300">nuestra fórmula.</span>
            </h1>

            <p className="text-white/70 text-lg leading-relaxed">
              FarmaCompara nació con una convicción simple: los colombianos merecen saber
              cuánto cuesta un medicamento en cada droguería antes de salir de casa.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {STATS.map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-4"
              >
                <Icon className={`w-8 h-8 shrink-0 ${color}`} />
                <div className="text-left">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-white/70 text-xs">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ¿Qué hacemos? ──────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
                Nuestra misión
              </p>
              <h2 className="text-3xl font-extrabold text-secondary-500 leading-tight mb-5">
                ¿Qué hace<br />FarmaCompara?
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Somos un comparador de precios de medicamentos enfocado en Colombia. Rastreamos
                precios en las principales cadenas de droguerías del país y los presentamos en
                un solo lugar para que puedas elegir dónde comprar con información real y actualizada.
              </p>
              <p className="text-gray-500 leading-relaxed">
                <strong className="text-gray-700">No vendemos medicamentos.</strong> No somos
                una droguería. Somos la herramienta que te ayuda a tomar la mejor decisión antes
                de comprar.
              </p>

              <Link
                href="/comparar"
                className="inline-flex items-center gap-2 mt-8 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Empezar a comparar →
              </Link>
            </div>

            {/* Visual */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Droguerías monitoreadas", value: "+80",     bg: "bg-primary-50",   text: "text-primary-600"   },
                { label: "Medicamentos comparados",  value: "+12.000", bg: "bg-secondary-50", text: "text-secondary-500" },
                { label: "Actualización de precios", value: "24/7",    bg: "bg-accent-50",    text: "text-accent-600"    },
                { label: "Costo para el usuario",    value: "$0",      bg: "bg-gray-50",      text: "text-gray-700"      },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-2xl p-6 flex flex-col gap-2`}>
                  <p className={`text-3xl font-extrabold ${text}`}>{value}</p>
                  <p className="text-sm text-gray-500 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Droguerías ─────────────────────────────────────────── */}
      <TrustBanner />

      {/* ── Nuestros valores ───────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2">
              Lo que nos guía
            </p>
            <h2 className="text-3xl font-extrabold text-secondary-500">Nuestros valores</h2>
            <p className="text-gray-400 mt-2 text-sm">Los principios detrás de cada decisión que tomamos</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALORES.map(({ icon: Icon, titulo, texto }) => (
              <div
                key={titulo}
                className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary-100 hover:shadow-primary-500/10 transition-all flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                  <Icon className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5 leading-snug">{titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-secondary-500 to-secondary-700 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            ¿Tienes alguna pregunta?
          </h2>
          <p className="text-white/60 text-base mb-8 leading-relaxed">
            Estamos aquí para ayudarte. Escríbenos y te responderemos en menos de 48 horas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contacto"
              className="bg-primary-500 hover:bg-primary-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto text-center"
            >
              Contáctanos
            </Link>
            <Link
              href="/faq"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto text-center"
            >
              Ver preguntas frecuentes
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
