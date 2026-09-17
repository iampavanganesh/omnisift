-- CreateTable
CREATE TABLE "brand_stats_daily" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "comparisons" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_stats_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_stats_daily_date_idx" ON "brand_stats_daily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "brand_stats_daily_brand_date_key" ON "brand_stats_daily"("brand", "date");
