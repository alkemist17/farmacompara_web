import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Lee los términos y condiciones de uso de FarmaCompara.",
};

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-primary-500 transition-colors font-medium">Inicio</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">Términos y condiciones</span>
      </nav>

      <h1 className="text-3xl font-extrabold text-secondary-500 mb-2">Términos y condiciones</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: mayo de 2025</p>

      <div className="space-y-10 text-gray-600 leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Aceptación de los términos</h2>
          <p>
            Al acceder o usar FarmaCompara (<strong>farmacompara.co</strong>) aceptas estos Términos y
            condiciones en su totalidad. Si no estás de acuerdo con alguna parte, te pedimos que no
            utilices el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. Descripción del servicio</h2>
          <p>
            FarmaCompara es un comparador de precios de medicamentos. Recopilamos y mostramos
            información de precios de droguerías colombianas con fines informativos. No somos una
            droguería, no vendemos medicamentos y no intermediamos en ninguna transacción de compra.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Exactitud de la información</h2>
          <p>
            Hacemos nuestro mejor esfuerzo para mantener los precios actualizados; sin embargo, los
            precios pueden variar sin previo aviso por parte de las droguerías. FarmaCompara no
            garantiza que los precios mostrados correspondan exactamente al precio final en el punto
            de venta. Te recomendamos confirmar el precio en la droguería antes de realizar cualquier
            compra.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Uso permitido</h2>
          <p>Al usar FarmaCompara te comprometes a:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>No utilizar el servicio para fines ilegales o no autorizados.</li>
            <li>No intentar acceder a sistemas, redes o datos sin autorización.</li>
            <li>No reproducir, distribuir ni explotar comercialmente el contenido sin autorización escrita.</li>
            <li>No interferir con el funcionamiento normal de la plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Propiedad intelectual</h2>
          <p>
            Todo el contenido de FarmaCompara —logotipos, diseño, textos y software— es propiedad de
            FarmaCompara o sus licenciantes y está protegido por la legislación colombiana e
            internacional de propiedad intelectual.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Limitación de responsabilidad</h2>
          <p>
            FarmaCompara no se responsabiliza por daños directos, indirectos o consecuentes derivados
            del uso o la imposibilidad de uso del servicio, ni por decisiones de compra tomadas con
            base en la información publicada.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos en cualquier momento. Los cambios entran en vigencia al
            ser publicados en esta página. El uso continuado del servicio implica la aceptación de
            los términos actualizados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">8. Ley aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será
            resuelta ante los jueces competentes de la ciudad de Bogotá D.C.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">9. Contacto</h2>
          <p>
            Para consultas sobre estos términos escríbenos a{" "}
            <a href="mailto:info@farmacompara.co" className="text-primary-500 hover:underline">
              info@farmacompara.co
            </a>{" "}
            o visita nuestra{" "}
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
