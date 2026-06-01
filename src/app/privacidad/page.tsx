import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Conoce cómo MediOfertas trata y protege tu información personal.",
  alternates: { canonical: "https://mediofertas.co/privacidad" },
};

const SECCIONES = [
  "Responsable del tratamiento",
  "Datos que recopilamos",
  "Finalidad del tratamiento",
  "Compartición de datos",
  "Cookies",
  "Retención de datos",
  "Tus derechos",
  "Cambios en esta política",
  "Contacto",
];

export default function PrivacidadPage() {
  return (
    <>
      {/* ── Cabecera ─────────────────────────────────────────── */}
      <section className="bg-secondary-500 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors font-medium">Inicio</Link>
            <span>›</span>
            <span className="text-white/80">Política de privacidad</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-primary-300 text-xs font-bold uppercase tracking-widest mb-1">Documento legal</p>
              <h1 className="text-3xl font-extrabold text-white">Política de privacidad</h1>
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
              titulo: "Responsable del tratamiento",
              contenido: (
                <p>
                  MediOfertas (<strong className="text-gray-800">mediofertas.co</strong>) es responsable del
                  tratamiento de los datos personales recopilados a través de esta plataforma, de conformidad
                  con la Ley 1581 de 2012 y sus decretos reglamentarios.
                </p>
              ),
            },
            {
              titulo: "Datos que recopilamos",
              contenido: (
                <>
                  <p className="mb-3">
                    MediOfertas recopila únicamente datos mínimos necesarios para operar el servicio:
                  </p>
                  <ul className="space-y-2 mb-4">
                    {[
                      { label: "Datos de navegación:", desc: "dirección IP, tipo de navegador, páginas visitadas y tiempo de sesión, con fines estadísticos." },
                      { label: "Búsquedas:", desc: "términos ingresados en el buscador, de forma anonimizada, para mejorar los resultados." },
                      { label: "Contacto:", desc: "nombre y correo electrónico si decides contactarnos voluntariamente." },
                    ].map(({ label, desc }) => (
                      <li key={label} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 shrink-0" />
                        <span><strong className="text-gray-800">{label}</strong> {desc}</span>
                      </li>
                    ))}
                  </ul>
                  <p>No requerimos registro ni recopilamos datos de identificación para usar el comparador.</p>
                </>
              ),
            },
            {
              titulo: "Finalidad del tratamiento",
              contenido: (
                <ul className="space-y-2">
                  {[
                    "Operar y mejorar la plataforma.",
                    "Analizar tendencias de búsqueda de forma agregada y anónima.",
                    "Responder consultas enviadas a través del formulario de contacto.",
                    "Cumplir obligaciones legales.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              titulo: "Compartición de datos",
              contenido: (
                <p>
                  MediOfertas <strong className="text-gray-800">no vende, alquila ni comparte</strong> datos
                  personales con terceros con fines comerciales. Podemos compartir información con proveedores
                  de servicios técnicos (hosting, analíticas) bajo estrictos acuerdos de confidencialidad, o
                  cuando la ley lo exija.
                </p>
              ),
            },
            {
              titulo: "Cookies",
              contenido: (
                <p>
                  Utilizamos cookies técnicas esenciales para el funcionamiento del sitio y cookies analíticas
                  anónimas para entender cómo se usa la plataforma. Puedes configurar tu navegador para bloquear
                  las cookies; esto puede afectar algunas funcionalidades.
                </p>
              ),
            },
            {
              titulo: "Retención de datos",
              contenido: (
                <p>
                  Los datos de navegación se conservan por un máximo de 12 meses. Los datos de contacto se
                  eliminan cuando dejan de ser necesarios para atender tu solicitud.
                </p>
              ),
            },
            {
              titulo: "Tus derechos",
              contenido: (
                <>
                  <p className="mb-3">De acuerdo con la Ley 1581 de 2012 tienes derecho a:</p>
                  <ul className="space-y-2 mb-4">
                    {[
                      "Conocer los datos que tenemos sobre ti.",
                      "Solicitar la actualización o corrección de tus datos.",
                      "Solicitar la supresión de tus datos.",
                      "Revocar la autorización de tratamiento.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p>
                    Para ejercer estos derechos escríbenos a{" "}
                    <a href="mailto:contacto@mediofertas.co" className="text-primary-500 hover:underline">
                      contacto@mediofertas.co
                    </a>
                    .
                  </p>
                </>
              ),
            },
            {
              titulo: "Cambios en esta política",
              contenido: (
                <p>
                  Podemos actualizar esta política en cualquier momento. La versión vigente siempre estará
                  disponible en esta página con la fecha de última actualización.
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
                      Para cualquier consulta sobre privacidad o para ejercer tus derechos, contáctanos
                      directamente o usa nuestro formulario.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="mailto:contacto@mediofertas.co"
                        className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        contacto@mediofertas.co
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
