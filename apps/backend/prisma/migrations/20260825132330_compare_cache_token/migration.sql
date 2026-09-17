/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `compare_cache` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "compare_cache_productId_key";

-- AlterTable
ALTER TABLE "compare_cache" ADD COLUMN     "token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "compare_cache_token_key" ON "compare_cache"("token");
