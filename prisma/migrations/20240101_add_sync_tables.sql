-- CreateTable for sync jobs
CREATE TABLE IF NOT EXISTS "sync_jobs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable for sync metadata
CREATE TABLE IF NOT EXISTS "sync_metadata" (
    "id" SERIAL NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "last_sync" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sync_metadata_organization_id_sync_type_key" ON "sync_metadata"("organization_id", "sync_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_jobs_organization_id_status_idx" ON "sync_jobs"("organization_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_jobs_created_at_idx" ON "sync_jobs"("created_at");
