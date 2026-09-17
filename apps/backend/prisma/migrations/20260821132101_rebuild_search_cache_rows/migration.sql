/*
  Warnings:

  - You are about to drop the column `createdAt` on the `search_cache` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `search_cache` table. All the data in the column will be lost.
  - You are about to drop the column `page` on the `search_cache` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `search_cache` table. All the data in the column will be lost.
  - You are about to drop the column `resultCount` on the `search_cache` table. All the data in the column will be lost.
  - You are about to drop the column `results` on the `search_cache` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `search_cache` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[normalizedQuery,productId]` on the table `search_cache` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `data` to the `search_cache` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `search_cache` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "search_cache" DROP CONSTRAINT "search_cache_providerId_fkey";

-- DropIndex
DROP INDEX "search_cache_expiresAt_idx";

-- DropIndex
DROP INDEX "search_cache_normalizedQuery_page_key";

-- AlterTable
ALTER TABLE "search_cache" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "page",
DROP COLUMN "providerId",
DROP COLUMN "resultCount",
DROP COLUMN "results",
DROP COLUMN "updatedAt",
ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "position" INTEGER,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "rawQuery" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "search_cache_normalizedQuery_idx" ON "search_cache"("normalizedQuery");

-- CreateIndex
CREATE INDEX "search_cache_normalizedQuery_available_idx" ON "search_cache"("normalizedQuery", "available");

-- CreateIndex
CREATE INDEX "search_cache_normalizedQuery_refreshedAt_idx" ON "search_cache"("normalizedQuery", "refreshedAt");

-- CreateIndex
CREATE UNIQUE INDEX "search_cache_normalizedQuery_productId_key" ON "search_cache"("normalizedQuery", "productId");
