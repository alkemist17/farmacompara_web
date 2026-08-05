import Image from "next/image";
import { TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";

const BENEFICIOS = [
  "Compara mayoristas en segundos",
  "Alertas de cambios de precio",
  "Historial y tendencias de precios",
  "Ahorra miles de pesos cada mes",
];

export default function RadarPromoBanner() {
  return (
    <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm p-5 overflow-hidden">
      {/* Resplandor decorativo detrás de la imagen */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-40 h-40 bg-primary-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Imagen del dashboard: asomada en diagonal a la derecha, a la mitad de la tarjeta */}
      <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 rotate-[10deg] rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
        <Image
          src="/radar-dashboard.png"
          alt="Dashboard de Radar MediOfertas"
          fill
          className="object-cover object-top"
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 mb-3">
          <TrendingUp className="w-5 h-5 text-primary-500 shrink-0" />
          <p className="text-xs text-primary-700 font-semibold">¿Compras para una farmacia?</p>
        </div>

        <h2 className="text-xl font-bold mb-2 leading-snug pr-20 sm:pr-24">
          <span className="text-primary-500">Radar</span>{" "}
          <span className="text-secondary-500">MediOfertas</span>
        </h2>

        <p className="text-base font-bold text-gray-700 mb-4 leading-relaxed pr-20 sm:pr-24">
          La inteligencia que te ayuda a comprar mejor y ahorrar más.
        </p>

        <ul className="space-y-1.5 mb-4 pr-16 sm:pr-20">
          {BENEFICIOS.map((beneficio) => (
            <li key={beneficio} className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              {beneficio}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <a
            href="https://radar.mediofertas.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            Conocer Radar
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="https://radar.mediofertas.co/authentication/sign-up"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-primary-200 text-primary-600 hover:bg-primary-50 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            Solicitar una demo
          </a>
        </div>
      </div>
    </div>
  );
}
