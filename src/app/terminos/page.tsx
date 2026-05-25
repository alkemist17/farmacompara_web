import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Lee los términos y condiciones de uso de FarmaCompara.",
  alternates: { canonical: "https://farmacompara.co/terminos" },
};

const SECCIONES = [
  "Aceptación de los términos",
  "Descripción del servicio",
  "Exactitud de la información",
  "Uso permitido",
  "Propiedad intelectual",
  "Limitación de responsabilidad",
  "Modificaciones",
  "Ley aplicable",
  "Contacto",
];

export default function TerminosPage() {
  return (
    <>
      {/* ── Cabecera ─────────────────────────────────────────── */}
      <section className="bg-secondary-500 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors font-medium">Inicio</Link>
            <span>›</span>
            <span className="text-white/80">Términos y condiciones</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-primary-300 text-xs font-bold uppercase tracking-widest mb-1">Documento legal</p>
              <h1 className="text-3xl font-extrabold text-white">Términos y condiciones</h1>
              <p className="text-white/50 text-sm mt-1">Última actualización: mayo de 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contenido ────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Tabla de contenidos */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Contenido</p>
          <ol className="space-y-2">
            {SECCIONES.map((titulo, i) => (
              <li key={titulo}>
                <a
                  href={`#seccion-${i + 1}`}
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-full bg-white border border-gray-200 group-hover:border-primary-300 group-hover:bg-primary-50 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-primary-600 transition-all shrink-0">
                    {i + 1}
                  </span>
                  {titulo}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Secciones */}
        <div className="space-y-12">

          {[
            {
              titulo: "Aceptación de los términos",
              contenido: (
                <p>
                  Al acceder o usar FarmaCompara (<strong className="text-gray-800">farmacompara.co</strong>) aceptas
                  estos Términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte, te pedimos
                  que no utilices el servicio.
                </p>
              ),
            },
            {
              titulo: "Descripción del servicio",
              contenido: (
                <p>
                  FarmaCompara es un comparador de precios de medicamentos. Recopilamos y mostramos información de
                  precios de droguerías colombianas con fines informativos. No somos una droguería, no vendemos
                  medicamentos y no intermediamos en ninguna transacción de compra.
                </p>
              ),
            },
            {
              titulo: "Exactitud de la información",
              contenido: (
                <p>
                  Hacemos nuestro mejor esfuerzo para mantener los precios actualizados; sin embargo, los precios
                  pueden variar sin previo aviso por parte de las droguerías. FarmaCompara no garantiza que los
                  precios mostrados correspondan exactamente al precio final en el punto de venta. Te recomendamos
                  confirmar el precio en la droguería antes de realizar cualquier compra.
                </p>
              ),
            },
            {
              titulo: "Uso permitido",
              contenido: (
                <>
                  <p className="mb-3">Al usar FarmaCompara te comprometes a:</p>
                  <ul className="space-y-2">
                    {[
                      "No utilizar el servicio para fines ilegales o no autorizados.",
                      "No intentar acceder a sistemas, redes o datos sin autorización.",
                      "No reproducir, distribuir ni explotar comercialmente el contenido sin autorización escrita.",
                      "No interferir con el funcionamiento normal de la plataforma.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ),
            },
            {
              titulo: "Propiedad intelectual",
              contenido: (
                <p>
                  Todo el contenido de FarmaCompara —logotipos, diseño, textos y software— es propiedad de
                  FarmaCompara o sus licenciantes y está protegido por la legislación colombiana e internacional
                  de propiedad intelectual.
                </p>
              ),
            },
            {
              titulo: "Limitación de responsabilidad",
              contenido: (
                <p>
                  FarmaCompara no se responsabiliza por daños directos, indirectos o consecuentes derivados del
                  uso o la imposibilidad de uso del servicio, ni por decisiones de compra tomadas con base en
                  la información publicada.
                </p>
              ),
            },
            {
              titulo: "Modificaciones",
              contenido: (
                <p>
                  Podemos actualizar estos términos en cualquier momento. Los cambios entran en vigencia al ser
                  publicados en esta página. El uso continuado del servicio implica la aceptación de los términos
                  actualizados.
                </p>
              ),
            },
            {
              titulo: "Ley aplicable",
              contenido: (
                <p>
                  Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será
                  resuelta ante los jueces competentes de la ciudad de Bogotá D.C.
                </p>
              ),
            },
          ].map((sec, i) => (
            <section key={sec.titulo} id={`seccion-${i + 1}`} className="scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 shrink-0">
                  {i + 1}
                </span>
                <h2 className="text-lg font-bold text-gray-900">{sec.titulo}</h2>
              </div>
              <div className="pl-11 text-gray-600 leading-relaxed">
                {sec.contenido}
              </div>
              {i < 7 && <div className="mt-12 border-b border-gray-100" />}
            </section>
          ))}

          {/* Sección 9 — Contacto como tarjeta destacada */}
          <section id="seccion-9" className="scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 shrink-0">
                9
              </span>
              <h2 className="text-lg font-bold text-gray-900">Contacto</h2>
            </div>
            <div className="pl-11">
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Para consultas sobre estos términos escríbenos directamente o visita nuestra página de contacto.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="mailto:info@farmacompara.co"
                        className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        info@farmacompara.co
                      </a>
                      <Link
                        href="/contacto"
                        className="inline-flex items-center gap-2 bg-white border border-primary-200 hover:border-primary-400 text-primary-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        Formulario de contacto
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
