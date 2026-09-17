-- CreateTable
CREATE TABLE "product_pool" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "normalizedQuery" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "position" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_pool_normalizedQuery_idx" ON "product_pool"("normalizedQuery");

-- CreateIndex
CREATE INDEX "product_pool_normalizedQuery_available_idx" ON "product_pool"("normalizedQuery", "available");

-- CreateIndex
CREATE UNIQUE INDEX "product_pool_normalizedQuery_productId_key" ON "product_pool"("normalizedQuery", "productId");
