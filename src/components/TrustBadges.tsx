import { RefreshCw, Lock, ShieldCheck, MapPin } from "lucide-react";

const badges = [
  { icon: RefreshCw,   title: "Precios actualizados",  desc: "Monitoreo diario de farmacias" },
  { icon: Lock,        title: "Conexión segura SSL",    desc: "Tus búsquedas son privadas" },
  { icon: ShieldCheck, title: "Resultados imparciales", desc: "Precios sin modificar ni patrocinar" },
  { icon: MapPin,      title: "Cobertura nacional",     desc: "Farmacias en toda Colombia" },
];

export default function TrustBadges() {
  return (
    <section className="bg-secondary-500 border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-white/50 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
