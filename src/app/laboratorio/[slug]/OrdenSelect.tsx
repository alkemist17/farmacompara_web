"use client";

interface Props {
  defaultValue: string;
  basePath: string;
  limit: number;
}

export default function OrdenSelect({ defaultValue, basePath, limit }: Props) {
  return (
    <select
      defaultValue={defaultValue}
      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 bg-white"
      onChange={(e) => {
        const url = new URLSearchParams({ orden: e.target.value, page: "1", limit: String(limit) });
        window.location.href = `${basePath}?${url}`;
      }}
    >
      <option value="precio_asc">Precio: menor a mayor</option>
      <option value="descuento">Mayor descuento (%)</option>
      <option value="popular">Más buscados</option>
    </select>
  );
}
