-- CreateTable
CREATE TABLE "api_usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "query" TEXT,
    "userId" UUID,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "durationMs" INTEGER,
    "estimatedCost" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_usage_logs_provider_createdAt_idx" ON "api_usage_logs"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "api_usage_logs_feature_createdAt_idx" ON "api_usage_logs"("feature", "createdAt");
