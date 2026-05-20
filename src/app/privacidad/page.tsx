import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Conoce cómo FarmaCompara trata y protege tu información personal.",
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-primary-500 transition-colors font-medium">Inicio</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">Política de privacidad</span>
      </nav>

      <h1 className="text-3xl font-extrabold text-secondary-500 mb-2">Política de privacidad</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: mayo de 2025</p>

      <div className="space-y-10 text-gray-600 leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
          <p>
            FarmaCompara (<strong>farmacompara.co</strong>) es responsable del tratamiento de los datos
            personales recopilados a través de esta plataforma, de conformidad con la Ley 1581 de 2012
            y sus decretos reglamentarios.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. Datos que recopilamos</h2>
          <p>FarmaCompara recopila únicamente datos mínimos necesarios para operar el servicio:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas y tiempo de sesión, con fines estadísticos.</li>
            <li><strong>Búsquedas:</strong> términos ingresados en el buscador, de forma anonimizada, para mejorar los resultados.</li>
            <li><strong>Contacto:</strong> nombre y correo electrónico si decides contactarnos voluntariamente.</li>
          </ul>
          <p className="mt-3">
            No requerimos registro ni recopilamos datos de identificación para usar el comparador.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Finalidad del tratamiento</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Operar y mejorar la plataforma.</li>
            <li>Analizar tendencias de búsqueda de forma agregada y anónima.</li>
            <li>Responder consultas enviadas a través del formulario de contacto.</li>
            <li>Cumplir obligaciones legales.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Compartición de datos</h2>
          <p>
            FarmaCompara <strong>no vende, alquila ni comparte</strong> datos personales con terceros
            con fines comerciales. Podemos compartir información con proveedores de servicios técnicos
            (hosting, analíticas) bajo estrictos acuerdos de confidencialidad, o cuando la ley lo exija.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Cookies</h2>
          <p>
            Utilizamos cookies técnicas esenciales para el funcionamiento del sitio y cookies
            analíticas anónimas para entender cómo se usa la plataforma. Puedes configurar tu
            navegador para bloquear las cookies; esto puede afectar algunas funcionalidades.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Retención de datos</h2>
          <p>
            Los datos de navegación se conservan por un máximo de 12 meses. Los datos de contacto
            se eliminan cuando dejan de ser necesarios para atender tu solicitud.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Tus derechos</h2>
          <p>De acuerdo con la Ley 1581 de 2012 tienes derecho a:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Conocer los datos que tenemos sobre ti.</li>
            <li>Solicitar la actualización o corrección de tus datos.</li>
            <li>Solicitar la supresión de tus datos.</li>
            <li>Revocar la autorización de tratamiento.</li>
          </ul>
          <p className="mt-3">
            Para ejercer estos derechos escríbenos a{" "}
            <a href="mailto:info@farmacompara.co" className="text-primary-500 hover:underline">
              info@farmacompara.co
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">8. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política en cualquier momento. La versión vigente siempre estará
            disponible en esta página con la fecha de última actualización.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">9. Contacto</h2>
          <p>
            Para cualquier consulta sobre privacidad contáctanos en{" "}
            <a href="mailto:info@farmacompara.co" className="text-primary-500 hover:underline">
              info@farmacompara.co
            </a>{" "}
            o en nuestra{" "}
            <Link href="/contacto" className="text-primary-500 hover:underline">
              página de contacto
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
