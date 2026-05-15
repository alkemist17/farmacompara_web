const PHARMACIES = [
  "Cruz Verde", "Farmatodo", "La Rebaja", "Colsubsidio", "Cafam", "Audifarma",
];

export default function TrustBanner() {
  return (
    <section className="py-10 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          Comparamos precios en las principales cadenas de Colombia
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {PHARMACIES.map((name) => (
            <span key={name} className="text-sm font-bold text-gray-400 hover:text-primary-500 transition-colors cursor-default">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
