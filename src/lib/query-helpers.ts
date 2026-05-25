// mv_precios_resumen agrega precio_min, precio_max y max_descuento por producto_id
// en un solo escaneo. Reemplaza el par PRECIOS_JOIN + DESCUENTOS_JOIN anterior.
export const PRECIOS_JOIN = `
  LEFT JOIN mv_precios_resumen precios ON precios.producto_id = mp.id
`;

// Mantenido para compatibilidad de imports; ya está absorbido en mv_precios_resumen.
export const DESCUENTOS_JOIN = ``;

export const TRENDS_JOIN = `
  LEFT JOIN (
    SELECT producto_id, SUM(clics) AS total_clics
    FROM product_trends
    WHERE semana >= NOW() - INTERVAL '28 days'
    GROUP BY producto_id
  ) trends ON trends.producto_id = mp.id
`;

export function getOrderClause(orden: string): string {
  switch (orden) {
    case "descuento":
      return "ORDER BY COALESCE(max_descuento, 0) DESC, precio_min ASC NULLS LAST";
    case "popular":
      return "ORDER BY COALESCE(total_clics, 0) DESC, precio_min ASC NULLS LAST";
    case "precio_asc":
    default:
      return "ORDER BY precio_min ASC NULLS LAST";
  }
}
