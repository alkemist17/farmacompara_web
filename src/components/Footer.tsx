import Link from "next/link";
import Logo from "@/components/Logo";

const LINKS = {
  "Explorar": [
    { label: "Todos los medicamentos", href: "/medicamentos" },
    { label: "Por categoría",          href: "/categorias"   },
    { label: "Genéricos",             href: "/genericos"    },
    { label: "Promociones",           href: "/promociones"  },
  ],
  "Droguerías": [
    { label: "Cruz Verde",     href: "/droguerias/cruz-verde" },
    { label: "Farmatodo",      href: "/droguerias/farmatodo"  },
    { label: "La Rebaja",      href: "/droguerias/la-rebaja"  },
    { label: "Ver todas",      href: "/droguerias"            },
  ],
  "FarmaCompara": [
    { label: "Nosotros",          href: "/nosotros"          },
    { label: "¿Cómo funciona?",  href: "/como-funciona"    },
    { label: "Para droguerías",   href: "/para-droguerias"  },
    { label: "Contacto",          href: "/contacto"         },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-secondary-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Logo size="md" variant="white" />
            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Tu ahorro, nuestra fórmula. Comparamos precios de medicamentos
              en tiempo real para que siempre pagues lo justo.
            </p>
            <p className="mt-4 text-xs text-white/40">
              ✉ info@farmacompara.com
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© 2025 FarmaCompara. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-white/70 transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white/70 transition-colors">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
