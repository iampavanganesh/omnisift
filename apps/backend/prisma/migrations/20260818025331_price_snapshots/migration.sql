-- CreateTable
CREATE TABLE "price_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" TEXT NOT NULL,
    "lowest" DECIMAL(12,2) NOT NULL,
    "highest" DECIMAL(12,2) NOT NULL,
    "average" DECIMAL(12,2) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_snapshots_productId_capturedAt_idx" ON "price_snapshots"("productId", "capturedAt");
