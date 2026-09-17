-- CreateTable
CREATE TABLE "product_external_ids" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_external_ids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_external_ids_productId_idx" ON "product_external_ids"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_external_ids_provider_externalId_key" ON "product_external_ids"("provider", "externalId");

-- AddForeignKey
ALTER TABLE "product_external_ids" ADD CONSTRAINT "product_external_ids_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
