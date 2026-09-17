-- CreateTable
CREATE TABLE "query_stats_daily" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "query_stats_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "query_stats_daily_date_idx" ON "query_stats_daily"("date");

-- CreateIndex
CREATE INDEX "query_stats_daily_searches_idx" ON "query_stats_daily"("searches");

-- CreateIndex
CREATE UNIQUE INDEX "query_stats_daily_query_date_key" ON "query_stats_daily"("query", "date");
