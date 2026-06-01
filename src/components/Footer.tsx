import Link from "next/link";
import Logo from "@/components/Logo";
import { Facebook, Instagram } from "lucide-react";
import UltimaActualizacion from "@/components/UltimaActualizacion";

const stats = [
  { value: "+120.000", label: "Productos indexados" },
  { value: "+2M",      label: "Precios monitoreados" },
  { value: "+5",       label: "Cadenas nacionales" },
  { value: "100%",     label: "Gratuito siempre" },
];

const socialLinks = [
  {
    href: "https://instagram.com/mediofertas",
    Icon: Instagram,
    name: "Instagram",
    desc: "Medicamentos con descuentos",
  },
  {
    href: "https://facebook.com/mediofertas",
    Icon: Facebook,
    name: "Facebook",
    desc: "Promociones y noticias",
  },
];

export default function Footer() {
  return (
    <footer className="bg-secondary-500 text-white">

      {/* Stats bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-primary-400">{value}</p>
              <p className="text-sm text-white/50 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex flex-col md:flex-row gap-12">

          {/* Brand */}
          <div className="md:w-72 shrink-0">
            <Logo size="md" variant="white" />
            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Comparamos precios de medicamentos en múltiples farmacias para ayudarte a ahorrar tiempo y dinero.
            </p>
            <a
              href="mailto:contacto@mediofertas.co"
              className="mt-4 inline-block text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              contacto@mediofertas.co
            </a>
          </div>

          {/* Link groups */}
          <div className="flex flex-col sm:flex-row gap-16 md:ml-auto">

            {/* Platform links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Plataforma
              </h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/nosotros",   label: "Sobre nosotros" },
                  { href: "/terminos",   label: "Términos y condiciones" },
                  { href: "/privacidad", label: "Política de privacidad" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Ayuda
              </h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/faq",      label: "Preguntas frecuentes" },
                  { href: "/contacto", label: "Contacto" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">
                Síguenos
              </h4>
              <p className="text-xs text-white/40 mb-4">Alertas y ahorro diario</p>
              <ul className="space-y-3">
                {socialLinks.map(({ href, Icon, name, desc }) => (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 group"
                    >
                      <Icon className="w-4 h-4 text-white/50 group-hover:text-white transition-colors shrink-0" />
                      <div>
                        <span className="block text-sm text-white/70 group-hover:text-white transition-colors leading-none">
                          {name}
                        </span>
                        <span className="block text-xs text-white/35 mt-0.5">{desc}</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>© {new Date().getFullYear()} MediOfertas. Todos los derechos reservados.</span>
            <span className="text-white/20">|</span>
            <UltimaActualizacion />
          </span>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-white/70 transition-colors">Privacidad</Link>
            <Link href="/terminos"   className="hover:text-white/70 transition-colors">Términos</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
