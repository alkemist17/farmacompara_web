export function PreciosSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">

      {/* Tarjeta nombre + mejor precio */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="h-6 w-3/4 bg-gray-100 rounded mb-2" />
        <div className="h-4 w-1/3 bg-gray-100 rounded mb-6" />
        <div className="flex gap-8 mt-5">
          <div>
            <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
            <div className="h-9 w-36 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded mt-2" />
          </div>
          <div>
            <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
            <div className="h-7 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* Tabla de precios */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="h-5 w-36 bg-gray-100 rounded" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 last:border-0">
            <div className="w-6 h-4 bg-gray-100 rounded" />
            <div className="flex-1 h-4 bg-gray-100 rounded" />
            <div className="w-24 h-4 bg-gray-100 rounded" />
            <div className="w-24 h-4 bg-gray-100 rounded" />
            <div className="w-16 h-4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Gráfica */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="h-5 w-64 bg-gray-100 rounded mb-6" />
        <div className="h-[280px] bg-gray-50 rounded-xl" />
      </div>
    </div>
  );
}
