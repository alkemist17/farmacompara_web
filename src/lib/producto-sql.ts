// Consultas SQL de /producto/[slug], sin dependencias para poder probarlas
// directamente contra la BD (src/lib/__tests__/producto-sql.int.test.ts).

// Un producto puede tener varios EAN (p. ej. empaque antiguo y nuevo del mismo
// registro). Los precios, la imagen y el historial se leen de todos ellos.
export const SQL_INFO = `
  SELECT
    mp.id, mp.slug, mp.nombre, mp.laboratorio, mp.principio_activo,
    mp.concentracion, mp.forma_farmaceutica, mp.presentacion,
    mp.condicion_venta, mp.via_administracion, mp.codigo_atc, mp.descripcion_atc, mp.indicaciones,
    mp.registro_invima,
    COALESCE(ARRAY(
      SELECT cb.ean
      FROM codigos_barras cb
      LEFT JOIN precios_retail p ON p.ean = cb.ean
      WHERE cb.producto_id = mp.id
      GROUP BY cb.ean
      ORDER BY MAX(p.fecha_revision) DESC NULLS LAST, cb.ean
    ), '{}') AS eans,
    (SELECT COUNT(*)::int
       FROM precios_retail p
       JOIN codigos_barras cb ON cb.ean = p.ean
      WHERE cb.producto_id = mp.id) AS total_precios
  FROM maestro_productos mp
  WHERE mp.slug = $1
    AND mp.excluido = false
  LIMIT 1
`;

// Una fila por cadena: si una cadena vende varios EAN del producto se toma la
// revisión más reciente (y, a igual fecha, el precio más bajo).
export const SQL_PRECIOS = `
  SELECT DISTINCT ON (p.fuente_id)
    p.fuente_id,
    p.ean,
    f.nombre        AS cadena,
    f.url,
    p.precio_costo,
    p.precio_oferta,
    p.condicion_oferta,
    p.stock,
    p.fecha_revision AS fecha_captura,
    CASE
      WHEN p.precio_oferta IS NOT NULL AND p.precio_costo IS NOT NULL
        THEN (p.precio_costo - p.precio_oferta)::float
      ELSE NULL
    END AS ahorro,
    CASE
      WHEN p.precio_oferta IS NOT NULL AND p.precio_costo > 0
        THEN ROUND(((p.precio_costo - p.precio_oferta) / p.precio_costo) * 100)::int
      ELSE NULL
    END AS ahorro_pct
  FROM precios_retail p
  JOIN codigos_barras cb ON cb.ean = p.ean
  JOIN fuentes_retail f ON f.id = p.fuente_id
  WHERE cb.producto_id = $1
  ORDER BY p.fuente_id, p.fecha_revision DESC, COALESCE(p.precio_oferta, p.precio_costo) ASC NULLS LAST
`;
