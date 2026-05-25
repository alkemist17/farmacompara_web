import Link from "next/link";
import Logo from "@/components/Logo";
import { Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex flex-col md:flex-row gap-12">

          {/* Brand */}
          <div className="md:w-72 shrink-0">
            <Logo size="md" variant="white" />
            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Tu ahorro, nuestra fórmula. Comparamos precios de medicamentos
              en tiempo real para que siempre pagues lo justo.
            </p>
            <p className="mt-4 text-xs text-white/40">
              ✉ info@farmacompara.co
            </p>
          </div>

          {/* Grupos de enlaces — pegados entre sí, empujados a la derecha */}
          <div className="flex flex-col sm:flex-row gap-16 md:ml-auto">

            {/* Enlaces útiles */}
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Enlaces útiles
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/nosotros" className="text-sm text-white/70 hover:text-white transition-colors">
                    Sobre nosotros
                  </Link>
                </li>
                <li>
                  <Link href="/terminos" className="text-sm text-white/70 hover:text-white transition-colors">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="text-sm text-white/70 hover:text-white transition-colors">
                    Política de privacidad
                  </Link>
                </li>
              </ul>
            </div>

            {/* Ayuda */}
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Ayuda
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/faq" className="text-sm text-white/70 hover:text-white transition-colors">
                    Preguntas frecuentes
                  </Link>
                </li>
                <li>
                  <Link href="/contacto" className="text-sm text-white/70 hover:text-white transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            {/* Redes sociales */}
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                Síguenos en redes sociales
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://facebook.com/farmacompara"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/farmacompara"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} FarmaCompara. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-white/70 transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white/70 transition-colors">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
