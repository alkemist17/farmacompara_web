"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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

function FaqItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-900 text-sm leading-snug">{pregunta}</span>
        <ChevronDown
          className={clsx(
            "w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
          {respuesta}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-14">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-primary-500 transition-colors font-medium">Inicio</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">Preguntas frecuentes</span>
      </nav>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-secondary-500 mb-2">Preguntas frecuentes</h1>
        <p className="text-gray-500 text-sm">Todo lo que necesitas saber sobre FarmaCompara</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((item) => (
          <FaqItem key={item.pregunta} {...item} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm mb-4">¿No encontraste lo que buscabas?</p>
        <Link
          href="/contacto"
          className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-semibold px-7 py-3 rounded-xl transition-colors"
        >
          Escríbenos
        </Link>
      </div>
    </div>
  );
}
