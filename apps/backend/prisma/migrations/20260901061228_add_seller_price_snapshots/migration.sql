-- CreateTable
CREATE TABLE "seller_price_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "mrp" DECIMAL(12,2),
    "discountPct" INTEGER,
    "availability" "Availability" NOT NULL DEFAULT 'UNKNOWN',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seller_price_snapshots_productId_capturedAt_idx" ON "seller_price_snapshots"("productId", "capturedAt");

-- CreateIndex
CREATE INDEX "seller_price_snapshots_sellerId_capturedAt_idx" ON "seller_price_snapshots"("sellerId", "capturedAt");

-- AddForeignKey
ALTER TABLE "seller_price_snapshots" ADD CONSTRAINT "seller_price_snapshots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_price_snapshots" ADD CONSTRAINT "seller_price_snapshots_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
