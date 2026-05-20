import type { Metadata } from "next";
import Link from "next/link";
import { Heart, BarChart2, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description: "Conoce la misión de FarmaCompara: ayudarte a encontrar los mejores precios de medicamentos en Colombia.",
};

const VALORES = [
  {
    icon: Heart,
    titulo: "Compromiso con tu salud",
    texto: "Creemos que el acceso a medicamentos asequibles es un derecho, no un privilegio. Por eso comparamos precios en tiempo real para que nunca pagues de más.",
  },
  {
    icon: BarChart2,
    titulo: "Transparencia total",
    texto: "Mostramos precios reales capturados directamente de las droguerías. Sin comisiones ocultas, sin precios inflados. Lo que ves es lo que pagas en tienda.",
  },
  {
    icon: Zap,
    titulo: "Información en tiempo real",
    texto: "Nuestros sistemas actualizan precios constantemente para darte la información más reciente de cada droguería.",
  },
  {
    icon: ShieldCheck,
    titulo: "Privacidad ante todo",
    texto: "No vendemos tus datos. No necesitas registrarte para usar FarmaCompara. Buscas, comparas y ahorras, sin rastros.",
  },
];

export default function NosotrosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-primary-500 transition-colors font-medium">Inicio</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">Sobre nosotros</span>
      </nav>

      {/* Hero */}
      <div className="bg-hero-gradient rounded-3xl px-8 py-14 text-center text-white mb-14">
        <p className="text-primary-300 text-sm font-semibold uppercase tracking-widest mb-3">Nuestra historia</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
          Tu ahorro, nuestra fórmula
        </h1>
        <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
          FarmaCompara nació con una convicción simple: los colombianos merecen saber cuánto cuesta
          un medicamento en cada droguería antes de salir de casa.
        </p>
      </div>

      {/* Misión */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-secondary-500 mb-3">¿Qué hacemos?</h2>
        <p className="text-gray-600 leading-relaxed">
          Somos un comparador de precios de medicamentos enfocado en Colombia. Rastreamos precios en
          las principales cadenas de droguerías del país —Farmatodo, Cruz Verde, Drogas La Rebaja,
          Colsubsidio y más— y los presentamos en un solo lugar para que puedas elegir dónde comprar
          con información real y actualizada.
        </p>
        <p className="text-gray-600 leading-relaxed mt-3">
          No vendemos medicamentos. No somos una droguería. Somos la herramienta que te ayuda a
          tomar la mejor decisión antes de comprar.
        </p>
      </section>

      {/* Valores */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-secondary-500 mb-6">Nuestros valores</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {VALORES.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{titulo}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center border-t border-gray-100 pt-10">
        <p className="text-gray-500 mb-4">¿Tienes alguna pregunta o sugerencia?</p>
        <Link
          href="/contacto"
          className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-semibold px-7 py-3 rounded-xl transition-colors"
        >
          Contáctanos
        </Link>
      </div>
    </div>
  );
}
