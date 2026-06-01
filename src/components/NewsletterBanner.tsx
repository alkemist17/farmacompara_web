import NewsletterForm from "@/components/NewsletterForm";

export default function NewsletterBanner() {
  return (
    <section className="py-12 bg-gray-50 border-y border-gray-100">
      <div className="max-w-2xl mx-auto px-4 text-center">

        <h3 className="text-3xl font-bold text-secondary-500 leading-snug">
          No pagues de más por tus medicamentos
        </h3>

        <p className="mt-3 text-base text-gray-500">
          Recibe alertas cuando encontremos mejores precios.
        </p>

        <div className="mt-5 flex justify-center">
          <NewsletterForm variant="light" />
        </div>

        <p className="mt-3 text-sm text-gray-400">
          Sin spam. Cancela cuando quieras. Tus datos están seguros.
        </p>

      </div>
    </section>
  );
}
