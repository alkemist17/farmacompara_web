-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" BIGSERIAL NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER,
    "entity_name" VARCHAR(150) NOT NULL,
    "metric_code" VARCHAR(50) NOT NULL,
    "metric_value" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_dm_type_metric_date" ON "daily_metrics"("entity_type", "metric_code", "snapshot_date");

-- CreateIndex
CREATE INDEX "idx_dm_date_type_entity" ON "daily_metrics"("snapshot_date", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_dm_snapshot" ON "daily_metrics"("snapshot_date", "entity_type", "entity_name", "metric_code");
