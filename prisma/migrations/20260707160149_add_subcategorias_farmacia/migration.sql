-- =========================================================
-- NUEVAS SUBCATEGORIAS + RECLASIFICACION - FARMACOMPARA
-- =========================================================
-- Ver categorias_propuestas.txt (raiz del repo) para el detalle y
-- justificacion de cada subcategoria.
--
-- IMPORTANTE:
--  - Escrito buscando por NOMBRE (no por ID) para que funcione sin
--    importar los IDs reales que tengan categorias/subcategorias en
--    cada base (dev/staging/produccion).
--  - No borra ni renombra nada. No toca productos que YA tienen una
--    subcategoria distinta de 'General / Otros' (no se pierde
--    clasificacion manual ya hecha). Idempotente: correrlo dos veces
--    no cambia el resultado (los INSERT usan ON CONFLICT DO NOTHING,
--    los UPDATE solo afectan filas NULL o en 'General / Otros').
--  - No lleva BEGIN/COMMIT propio: el runner de migraciones del
--    proyecto (staging/scripts/migrate.js) ya envuelve cada
--    migration.sql en su propia transaccion.
--  - Validado con dry-run (ROLLBACK) contra la base de dev el
--    2026-07-07: 3626 productos sin subcategoria tras aplicar,
--    igual a lo estimado en categorias_propuestas.txt (4084/7710 = 53.0%).
-- =========================================================

-- =========================================================
-- PASO 1: Crear subcategorias nuevas
-- =========================================================

INSERT INTO subcategorias (categoria_id, nombre, slug, descripcion)
SELECT id,
       'Antihipertensivos, Antidiabeticos y Tiroideos',
       'antihipertensivos-antidiabeticos-y-tiroideos',
       'Medicamentos cardiovasculares, para diabetes y para tiroides. Mayoria venta con formula medica.'
FROM categorias WHERE nombre = 'Medicamentos y Salud'
ON CONFLICT (categoria_id, nombre) DO NOTHING;

INSERT INTO subcategorias (categoria_id, nombre, slug, descripcion)
SELECT id,
       'Antibioticos y Antivirales',
       'antibioticos-y-antivirales',
       'Antiinfecciosos sistemicos. Mayoria venta con formula medica.'
FROM categorias WHERE nombre = 'Medicamentos y Salud'
ON CONFLICT (categoria_id, nombre) DO NOTHING;

INSERT INTO subcategorias (categoria_id, nombre, slug, descripcion)
SELECT id,
       'Corticoides y Antimicoticos',
       'corticoides-y-antimicoticos',
       'Corticoides topicos y antimicoticos de uso dermatologico, de formula medica. Distinto de Dermocosmetica (cosmeticos).'
FROM categorias WHERE nombre = 'Medicamentos y Salud'
ON CONFLICT (categoria_id, nombre) DO NOTHING;

INSERT INTO subcategorias (categoria_id, nombre, slug, descripcion)
SELECT id,
       'Cuidado Ocular y Otico',
       'cuidado-ocular-y-otico',
       'Lagrimas artificiales, gotas oftalmicas y oticas.'
FROM categorias WHERE nombre = 'Medicamentos y Salud'
ON CONFLICT (categoria_id, nombre) DO NOTHING;

INSERT INTO subcategorias (categoria_id, nombre, slug, descripcion)
SELECT id,
       'Insumos y Dispositivos Medicos',
       'insumos-y-dispositivos-medicos',
       'Material de curacion, dispositivos de diagnostico (glucometros, tensiometros, pruebas) y ayudas tecnicas.'
FROM categorias WHERE nombre = 'Medicamentos y Salud'
ON CONFLICT (categoria_id, nombre) DO NOTHING;

INSERT INTO subcategorias (categoria_id, nombre, slug, descripcion)
SELECT id,
       'Higiene Femenina y Proteccion Adulto',
       'higiene-femenina-y-proteccion-adulto',
       'Toallas higienicas, tampones, protectores diarios y proteccion para adulto (no confundir con panales de bebe).'
FROM categorias WHERE nombre = 'Cuidado Personal'
ON CONFLICT (categoria_id, nombre) DO NOTHING;

-- =========================================================
-- PASO 2: Reclasificar productos
-- Solo se tocan productos SIN subcategoria o que hoy estan en el
-- "cajon" General / Otros (para no pisar clasificacion ya buena).
-- Orden: de mas especifico a menos especifico.
-- =========================================================

-- 2.1 Insumos y Dispositivos Medicos
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Insumos y Dispositivos Medicos')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND upper(mp.nombre) ~ 'ESPARADRAPO|GORRO QUIRURGICO|GUANTE|TAPABOCAS|MASCARILLA|JERINGA|GASA|VENDA|TERMOMETRO|GLUCOMETRO|TIRAS REACTIVAS|PRUEBA DE EMBARAZO|NEBULIZADOR|TENSIOMETRO|MEDIA.*ANTIEMBOLICA|ALGODON|CURITA|APOSITO|COPITOS|BAJALENGUA|ALCOHOL ANTISEPTICO|SUERO FISIOLOGICO|SOLUCION SALINA|SONDA|SUTURA|SILLA DE RUEDAS|MULETA|BASTON|OXIMETRO|COLLAR CERVICAL|FERULA';

-- 2.2 Antihipertensivos, Antidiabeticos y Tiroideos
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Antihipertensivos, Antidiabeticos y Tiroideos')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'LEVOTIROXINA|EUTIROX|METIMAZOL|PROPILTIOURACILO|METFORMINA|INSULINA|GLIBENCLAMIDA|GLIMEPIRIDA|SITAGLIPTINA|LINAGLIPTINA|EMPAGLIFLOZINA|DAPAGLIFLOZINA|GLICAZIDA|VILDAGLIPTINA|LOSARTAN|AMLODIPINO|VALSARTAN|OLMESARTAN|ROSUVASTATINA|ATORVASTATINA|CARVEDILOL|ENALAPRIL|CAPTOPRIL|BISOPROLOL|METOPROLOL|TELMISARTAN|IRBESARTAN|NIFEDIPINO|SIMVASTATINA|CLOPIDOGREL|WARFARINA|ACENOCUMAROL|CARDIOASPIRINA|IVABRADINA|HIDROCLOROTIAZIDA|FUROSEMIDA|ESPIRONOLACTONA|DIGOXINA|DILTIAZEM';

-- 2.3 Antibioticos y Antivirales
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Antibioticos y Antivirales')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'AMOXICILINA|CLINDAMICINA|METRONIDAZOL|CEFALEXINA|CLARITROMICINA|AZITROMICINA|CIPROFLOXACINA|LEVOFLOXACINA|DOXICICLINA|TRIMETOPRIM|SULTAMICILINA|CEFUROXIMA|AMPICILINA|PENICILINA|MOXIFLOXACINA|ACICLOVIR|VALACICLOVIR|OSELTAMIVIR';

-- 2.4 Corticoides y Antimicoticos
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Corticoides y Antimicoticos')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'MOMETASONA|BETAMETASONA|CLOBETASOL|DEXAMETASONA|PREDNISOLONA|PREDNISONA|HIDROCORTISONA|CLOTRIMAZOL|TERBINAFINA|KETOCONAZOL|FLUCONAZOL|MICONAZOL|ITRACONAZOL';

-- 2.5 Cuidado Ocular y Otico
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Cuidado Ocular y Otico')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'LAGRIMAS ARTIFICIALES|TIMOLOL|LATANOPROST|BRIMONIDINA|OFTALM|OTICA|OTICO|LENTES DE CONTACTO';

-- 2.6 Dolor y Fiebre (subcategoria EXISTENTE, mismo nombre, se amplia cobertura
--     con dolor cronico/antiinflamatorios y sistema nervioso, que no tenian donde caer)
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Dolor y Fiebre')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'PARACETAMOL|IBUPROFEN|KETOPROFENO|PREGABALINA|GABAPENTINA|TRAMADOL|ETORICOXIB|CELECOXIB|DICLOFENACO|NAPROXENO|KETOROLACO|BETAHISTINA|SERTRALINA|FLUOXETINA|ESCITALOPRAM|ALPRAZOLAM|CLONAZEPAM|DIAZEPAM|ZOLPIDEM|VENLAFAXINA|DULOXETINA|PRAMIPEXOLA|LEVETIRACETAM|CITICOLINA|ACIDO ACETILSALICILICO|ACIDO VALPROICO';

-- 2.7 Gripa y Tos (subcategoria EXISTENTE, mismo nombre, se amplia cobertura
--     con antihistaminicos/alergias y broncodilatadores/asma)
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Gripa y Tos')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'ACETILCISTEINA|BROMHEXINA|SALBUTAMOL|MONTELUKAST|FORMOTEROL|SALMETEROL|BUDESONIDA|FLUTICASONA|DESLORATADINA|LEVOCETIRIZINA|CETIRIZINA|LORATADINA|FEXOFENADINA|CLORFENIRAMINA|BILASTINA|AMBROXOL|DEXTROMETORFANO|GUAIFENESINA';

-- 2.8 Digestivos (subcategoria EXISTENTE, mismo nombre, se amplia cobertura;
--     se agregan laxantes y productos para el mareo, encontrados al revisar
--     el CSV de referencia)
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Digestivos')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'TRIMEBUTINA|BUTILESCOPOLAMINA|ACIDO ALGINICO|ELECTROLITOS|REHIDRATACION|ANTIFLATULENT|PIRANTEL|ALBENDAZOL|MEBENDAZOL|NITAZOXANIDA|IVERMECTINA|SECNIDAZOL|OMEPRAZOL|ESOMEPRAZOL|PANTOPRAZOL|RANITIDINA|LOPERAMIDA|BACILLUS|LACTOBACILL|SIMETICONA|DOMPERIDONA|LAXANTE|BISACODILO|POLIETILENGLICOL|MAREO';

-- 2.9 Salud Sexual (subcategoria EXISTENTE, mismo nombre, se amplia cobertura
--     con anticonceptivos/hormonales y, por el CSV de referencia, higiene
--     intima y lubricantes)
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Salud Sexual')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'TADALAFIL|SILDENAFIL|ANTICONCEP|LEVONORGESTREL|ETINILESTRADIOL|DROSPIRENONA|DESOGESTREL|PRESERVATIVO|CONDON|MEDROXIPROGESTERONA|LUBRICANTE INTIM|HIGIENE INTIMA';

-- 2.10 Vitaminas y Suplementos (subcategoria existente, mismo nombre, se amplia cobertura)
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Vitaminas y Suplementos')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND (upper(mp.nombre) || ' ' || upper(coalesce(mp.principio_activo,'')) || ' ' || upper(coalesce(mp.descripcion_atc,'')))
      ~ 'COLECALCIFEROL|TIAMINA|VIT B|VITAMINA|MULTIVITAM|COMPLEJO B|ACIDO FOLICO|OMEGA 3|CALCIO\+|ZINC|HIERRO|SULFATO FERROSO';

-- 2.11 Higiene Femenina y Proteccion Adulto (subcategoria nueva)
UPDATE maestro_productos mp
SET subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'Higiene Femenina y Proteccion Adulto')
WHERE (mp.subcategoria_id IS NULL
       OR mp.subcategoria_id = (SELECT id FROM subcategorias WHERE nombre = 'General / Otros'))
  AND upper(mp.nombre) ~ 'TOALLA.*HIGIENIC|TOALLA.*FEMENIN|TAMPON|PROTECTOR.*DIARIO|\yTENA\y|\yNOSOTRAS\y|COPA MENSTRUAL';

-- =========================================================
-- Verificacion de referencia (no se ejecuta en el runner de
-- migraciones, queda documentada para revisar a mano si hace falta):
--
-- SELECT c.nombre AS categoria, s.nombre AS subcategoria, count(mp.id) AS num_productos
-- FROM subcategorias s
-- JOIN categorias c ON c.id = s.categoria_id
-- LEFT JOIN maestro_productos mp ON mp.subcategoria_id = s.id
-- GROUP BY c.nombre, s.nombre
-- ORDER BY c.nombre, num_productos DESC;
--
-- SELECT count(*) AS productos_sin_subcategoria
-- FROM maestro_productos WHERE subcategoria_id IS NULL;
-- =========================================================
