import { Search, GitCompareArrows, MapPin } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    step: "01",
    title: "Busca tu medicamento",
    desc: "Escribe el nombre comercial o el principio activo. Te sugerimos opciones mientras escribes.",
  },
  {
    icon: GitCompareArrows,
    step: "02",
    title: "Compara precios al instante",
    desc: "Ve en segundos en qué droguería está más barato tu medicamento hoy, en tiempo real.",
  },
  {
    icon: MapPin,
    step: "03",
    title: "Elige y ahorra",
    desc: "Dirígete a la droguería más conveniente y guarda hasta un 60% en tus compras mensuales.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-gradient-to-br from-secondary-500 to-secondary-700 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
      />

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">¿Cómo funciona FarmaCompara?</h2>
          <p className="text-white/60 mt-2 text-base">Simple, rápido y gratuito</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="text-center group">
              <div className="relative inline-flex items-center justify-center mb-5">
                <span className="absolute -top-2 -right-2 text-5xl font-black text-white/5 leading-none select-none">
                  {step}
                </span>
                <div className="w-16 h-16 bg-white/10 group-hover:bg-primary-500/30 border border-white/20 rounded-2xl flex items-center justify-center transition-colors">
                  <Icon className="w-7 h-7 text-primary-300" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
