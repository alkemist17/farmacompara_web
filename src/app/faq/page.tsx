"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown, MessageSquare } from "lucide-react";
import clsx from "clsx";

const FAQS = [
  {
    pregunta: "¿FarmaCompara vende medicamentos?",
    respuesta:
      "No. Somos únicamente un comparador de precios. No vendemos ningún producto ni intermediamos en compras. Cuando encuentras el mejor precio, vas directamente a la droguería (física o en línea) a realizar tu compra.",
  },
  {
    pregunta: "¿Con qué frecuencia se actualizan los precios?",
    respuesta:
      "Nuestros sistemas capturan precios de las droguerías de forma continua. Sin embargo, los precios pueden cambiar en cualquier momento en los puntos de venta. Siempre te recomendamos confirmar el precio final antes de comprar.",
  },
  {
    pregunta: "¿Qué droguerías están en FarmaCompara?",
    respuesta:
      "Actualmente comparamos precios de las principales cadenas de droguerías de Colombia, entre ellas Farmatodo, Cruz Verde, Drogas La Rebaja, Colsubsidio y Droguería Bayer. Seguimos añadiendo más fuentes constantemente.",
  },
  {
    pregunta: "¿Necesito crear una cuenta para usar FarmaCompara?",
    respuesta:
      "No. Puedes buscar y comparar precios sin registrarte. No pedimos correo electrónico ni datos personales para usar el comparador.",
  },
  {
    pregunta: "¿Cómo busco un medicamento?",
    respuesta:
      "Usa el buscador en la página principal. Puedes buscar por nombre comercial, principio activo, laboratorio o código EAN. También puedes explorar por categorías para descubrir productos.",
  },
  {
    pregunta: "¿Qué significa el precio en color verde?",
    respuesta:
      "El precio en verde es el precio mínimo encontrado en alguna droguería para ese producto. Si hay un rango, el precio máximo aparece en gris debajo.",
  },
  {
    pregunta: "¿Puedo ver el historial de precios de un producto?",
    respuesta:
      "Sí. En la página de detalle de cada producto encontrarás una gráfica con el historial de precios por droguería, para que puedas ver si el precio subió, bajó o se ha mantenido.",
  },
  {
    pregunta: "¿Cómo puedo reportar un precio incorrecto?",
    respuesta:
      "Puedes enviarnos un mensaje desde nuestra página de contacto indicando el producto y el precio que observas incorrecto. Lo revisamos y corregimos a la brevedad.",
  },
  {
    pregunta: "¿FarmaCompara está disponible como aplicación móvil?",
    respuesta:
      "Por ahora FarmaCompara funciona como sitio web optimizado para móvil. Puedes añadirlo a tu pantalla de inicio desde el navegador de tu teléfono para una experiencia similar a una app.",
  },
];

function FaqItem({ pregunta, respuesta, index }: { pregunta: string; respuesta: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={clsx(
      "rounded-2xl border transition-all overflow-hidden",
      open
        ? "bg-white border-primary-200 shadow-md shadow-primary-500/10"
        : "bg-white border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md"
    )}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className={clsx(
          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
          open
            ? "bg-primary-500 text-white"
            : "bg-gray-100 text-gray-400"
        )}>
          {index + 1}
        </span>
        <span className={clsx(
          "flex-1 font-semibold text-sm leading-snug transition-colors",
          open ? "text-primary-700" : "text-gray-900"
        )}>
          {pregunta}
        </span>
        <ChevronDown className={clsx(
          "w-5 h-5 shrink-0 transition-all duration-200",
          open ? "rotate-180 text-primary-500" : "text-gray-300"
        )} />
      </button>

      {open && (
        <div className="px-6 pb-5 border-t border-primary-100">
          <p className="text-sm text-gray-500 leading-relaxed pt-4 pl-11">
            {respuesta}
          </p>
        </div>
      )}
    </div>
  );
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ pregunta, respuesta }) => ({
    "@type": "Question",
    name: pregunta,
    acceptedAnswer: { "@type": "Answer", text: respuesta },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* ── Cabecera ─────────────────────────────────────────── */}
      <section className="bg-secondary-500 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors font-medium">Inicio</Link>
            <span>›</span>
            <span className="text-white/80">Preguntas frecuentes</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-primary-300 text-xs font-bold uppercase tracking-widest mb-1">Soporte</p>
              <h1 className="text-3xl font-extrabold text-white">Preguntas frecuentes</h1>
              <p className="text-white/50 text-sm mt-1">Todo lo que necesitas saber sobre FarmaCompara</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Acordeón ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <FaqItem key={item.pregunta} index={i} {...item} />
          ))}
        </div>

        {/* CTA final */}
        <div className="mt-12">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">¿No encontraste lo que buscabas?</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Escríbenos y te respondemos en menos de 48 horas hábiles.
                </p>
                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ir a contacto
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
