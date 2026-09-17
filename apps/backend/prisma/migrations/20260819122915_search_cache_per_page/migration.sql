/*
  Warnings:

  - A unique constraint covering the columns `[normalizedQuery,page]` on the table `search_cache` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "search_cache_normalizedQuery_key";

-- AlterTable
ALTER TABLE "search_cache" ADD COLUMN     "page" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "search_cache_normalizedQuery_page_key" ON "search_cache"("normalizedQuery", "page");
