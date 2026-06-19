-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigos_barras" (
    "ean" VARCHAR(20) NOT NULL,
    "producto_id" INTEGER,
    "fallos_consecutivos" SMALLINT NOT NULL DEFAULT 0,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "fecha_ultimo_fallo" TIMESTAMPTZ(6),

    CONSTRAINT "codigos_barras_pkey" PRIMARY KEY ("ean")
);

-- CreateTable
CREATE TABLE "feedback_comparacion" (
    "id" SERIAL NOT NULL,
    "ean" VARCHAR(30) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "respuesta" BOOLEAN NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "user_id" VARCHAR(36),
    "usuario_id" TEXT,

    CONSTRAINT "feedback_comparacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuentes" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "url" VARCHAR(255),

    CONSTRAINT "fuentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_candidatas" (
    "ean" VARCHAR(20) NOT NULL,
    "fuente_id" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "prioridad" SMALLINT NOT NULL DEFAULT 99
);

-- CreateTable
CREATE TABLE "logs_errores" (
    "id" BIGSERIAL NOT NULL,
    "fuente" VARCHAR(100) NOT NULL,
    "ean" VARCHAR(20),
    "url" VARCHAR(500),
    "codigo_http" SMALLINT,
    "mensaje" TEXT,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_errores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maestro_productos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "laboratorio" VARCHAR(150),
    "registro_invima" VARCHAR(50),
    "principio_activo" VARCHAR(500),
    "concentracion" VARCHAR(100),
    "forma_farmaceutica" VARCHAR(150),
    "presentacion" VARCHAR(150),
    "condicion_venta" VARCHAR(50),
    "indicaciones" TEXT,
    "slug" VARCHAR(255) NOT NULL,
    "subcategoria_id" INTEGER,
    "via_administracion" VARCHAR(150),
    "codigo_atc" VARCHAR(15),
    "descripcion_atc" VARCHAR(200),
    "invima_enriquecido" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maestro_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precios" (
    "ean" VARCHAR(20) NOT NULL,
    "fuente_id" INTEGER NOT NULL,
    "precio_costo" DECIMAL(14,2),
    "precio_oferta" DECIMAL(14,2),
    "condicion_oferta" VARCHAR(255),
    "stock" BOOLEAN,
    "fecha_revision" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cambio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "precios_pkey" PRIMARY KEY ("ean","fuente_id")
);

-- CreateTable
CREATE TABLE "precios_historicos" (
    "id_precio" BIGSERIAL NOT NULL,
    "ean" VARCHAR(20) NOT NULL,
    "fuente_id" INTEGER NOT NULL,
    "precio_costo" DECIMAL(14,2),
    "precio_oferta" DECIMAL(14,2),
    "condicion_oferta" VARCHAR(255),
    "stock" BOOLEAN,
    "fecha_captura" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "precios_historicos_pkey" PRIMARY KEY ("id_precio")
);

-- CreateTable
CREATE TABLE "product_trends" (
    "id" BIGSERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "semana" DATE NOT NULL,
    "clics" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_imagen" (
    "producto_id" INTEGER NOT NULL,
    "url_fuente" VARCHAR(500),
    "ruta_local" VARCHAR(255) NOT NULL,
    "procesada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_imagen_pkey" PRIMARY KEY ("producto_id")
);

-- CreateTable
CREATE TABLE "schema_migrations" (
    "nombre" VARCHAR(255) NOT NULL,
    "aplicada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("nombre")
);

-- CreateTable
CREATE TABLE "strikes_fuente" (
    "ean" VARCHAR(20) NOT NULL,
    "fuente_id" INTEGER NOT NULL,
    "strikes" SMALLINT NOT NULL DEFAULT 0,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_bloqueo" TIMESTAMPTZ(6),

    CONSTRAINT "strikes_fuente_pkey" PRIMARY KEY ("ean","fuente_id")
);

-- CreateTable
CREATE TABLE "subcategorias" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "subcategorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_precio" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'cualquier_bajada',
    "precio_objetivo" DECIMAL(14,2),
    "ultimo_precio_notificado" DECIMAL(14,2),
    "fecha_ultima_notificacion" TIMESTAMPTZ(6),
    "notificaciones_enviadas" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_precio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE INDEX "idx_cb_estado" ON "codigos_barras"("estado");

-- CreateIndex
CREATE INDEX "idx_cb_producto" ON "codigos_barras"("producto_id");

-- CreateIndex
CREATE INDEX "idx_feedback_ean" ON "feedback_comparacion"("ean");

-- CreateIndex
CREATE INDEX "idx_feedback_fecha" ON "feedback_comparacion"("fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_feedback_tipo" ON "feedback_comparacion"("tipo");

-- CreateIndex
CREATE INDEX "idx_feedback_user_ean_tipo" ON "feedback_comparacion"("user_id", "ean", "tipo");

-- CreateIndex
CREATE INDEX "idx_feedback_usuario" ON "feedback_comparacion"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "fuentes_nombre_key" ON "fuentes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "imagenes_candidatas_ean_key" ON "imagenes_candidatas"("ean");

-- CreateIndex
CREATE INDEX "idx_ic_ean" ON "imagenes_candidatas"("ean");

-- CreateIndex
CREATE INDEX "idx_le_fecha" ON "logs_errores"("fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_le_fuente" ON "logs_errores"("fuente");

-- CreateIndex
CREATE UNIQUE INDEX "uix_mp_slug" ON "maestro_productos"("slug");

-- CreateIndex
CREATE INDEX "idx_mp_invima_pendiente" ON "maestro_productos"("invima_enriquecido") WHERE ((registro_invima IS NOT NULL) AND (invima_enriquecido = false));

-- CreateIndex
CREATE INDEX "idx_mp_subcategoria" ON "maestro_productos"("subcategoria_id");

-- CreateIndex
CREATE INDEX "idx_p_ean" ON "precios"("ean");

-- CreateIndex
CREATE INDEX "idx_p_fuente" ON "precios"("fuente_id");

-- CreateIndex
CREATE INDEX "idx_ph_ean" ON "precios_historicos"("ean");

-- CreateIndex
CREATE INDEX "idx_ph_fecha" ON "precios_historicos"("fecha_captura" DESC);

-- CreateIndex
CREATE INDEX "idx_ph_fuente" ON "precios_historicos"("fuente_id");

-- CreateIndex
CREATE INDEX "idx_pt_producto" ON "product_trends"("producto_id");

-- CreateIndex
CREATE INDEX "idx_pt_semana_clics" ON "product_trends"("semana" DESC, "clics" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_pt_producto_semana" ON "product_trends"("producto_id", "semana");

-- CreateIndex
CREATE INDEX "idx_sf_ean" ON "strikes_fuente"("ean");

-- CreateIndex
CREATE INDEX "idx_sf_fuente" ON "strikes_fuente"("fuente_id");

-- CreateIndex
CREATE UNIQUE INDEX "subcategorias_slug_key" ON "subcategorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subcategorias_categoria_id_nombre_key" ON "subcategorias"("categoria_id", "nombre");

-- CreateIndex
CREATE INDEX "idx_fav_usuario" ON "favoritos"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_fav_producto" ON "favoritos"("producto_id");

-- CreateIndex
CREATE INDEX "idx_fav_created" ON "favoritos"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_favorito_usuario_producto" ON "favoritos"("usuario_id", "producto_id");

-- CreateIndex
CREATE INDEX "idx_ap_usuario" ON "alertas_precio"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_ap_producto" ON "alertas_precio"("producto_id");

-- CreateIndex
CREATE INDEX "idx_ap_activa" ON "alertas_precio"("activa") WHERE (activa = true);

-- CreateIndex
CREATE UNIQUE INDEX "uq_alerta_usuario_producto" ON "alertas_precio"("usuario_id", "producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_email_idx" ON "EmailVerificationToken"("email");

-- AddForeignKey
ALTER TABLE "codigos_barras" ADD CONSTRAINT "codigos_barras_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "maestro_productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feedback_comparacion" ADD CONSTRAINT "feedback_comparacion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_comparacion" ADD CONSTRAINT "feedback_comparacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "imagenes_candidatas" ADD CONSTRAINT "imagenes_candidatas_ean_fkey" FOREIGN KEY ("ean") REFERENCES "codigos_barras"("ean") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "imagenes_candidatas" ADD CONSTRAINT "imagenes_candidatas_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maestro_productos" ADD CONSTRAINT "maestro_productos_subcategoria_id_fkey" FOREIGN KEY ("subcategoria_id") REFERENCES "subcategorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "precios" ADD CONSTRAINT "precios_ean_fkey" FOREIGN KEY ("ean") REFERENCES "codigos_barras"("ean") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "precios" ADD CONSTRAINT "precios_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "precios_historicos" ADD CONSTRAINT "precios_historicos_ean_fkey" FOREIGN KEY ("ean") REFERENCES "codigos_barras"("ean") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "precios_historicos" ADD CONSTRAINT "precios_historicos_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_trends" ADD CONSTRAINT "product_trends_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "maestro_productos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto_imagen" ADD CONSTRAINT "producto_imagen_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "maestro_productos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "strikes_fuente" ADD CONSTRAINT "strikes_fuente_ean_fkey" FOREIGN KEY ("ean") REFERENCES "codigos_barras"("ean") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "strikes_fuente" ADD CONSTRAINT "strikes_fuente_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subcategorias" ADD CONSTRAINT "subcategorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "maestro_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_precio" ADD CONSTRAINT "alertas_precio_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "maestro_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_precio" ADD CONSTRAINT "alertas_precio_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
