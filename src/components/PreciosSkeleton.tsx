export function PreciosSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Hero: una sola card con grid interno */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Col 1: precio */}
          <div className="bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 p-6 space-y-3">
            <div className="h-6 w-28 bg-gray-200 rounded-full" />
            <div className="h-3 w-36 bg-gray-100 rounded" />
            <div className="h-10 w-40 bg-gray-200 rounded" />
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-7 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-100 rounded" />
            </div>
            <div className="h-10 w-full bg-gray-200 rounded-xl" />
            <div className="h-3 w-36 bg-gray-100 rounded mx-auto" />
          </div>
          {/* Col 2-3: info + imagen */}
          <div className="lg:col-span-2 p-6 flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/3 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded mt-3" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
                <div className="h-6 w-28 bg-gray-100 rounded-full" />
                <div className="h-6 w-24 bg-gray-100 rounded-full" />
              </div>
            </div>
            <div className="hidden sm:block flex-none w-44 h-44 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ficha técnica */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 py-2 border-b border-gray-50">
              <div className="w-4 h-4 bg-gray-100 rounded" />
              <div className="w-28 h-3 bg-gray-100 rounded" />
              <div className="flex-1 h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Tabla + gráfica */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="h-5 w-36 bg-gray-200 rounded" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 last:border-0">
                <div className="w-6 h-4 bg-gray-100 rounded" />
                <div className="flex-1 h-4 bg-gray-100 rounded" />
                <div className="w-24 h-4 bg-gray-100 rounded" />
                <div className="w-24 h-4 bg-gray-100 rounded" />
                <div className="w-16 h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="h-5 w-64 bg-gray-200 rounded mb-6" />
            <div className="h-[280px] bg-gray-50 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
