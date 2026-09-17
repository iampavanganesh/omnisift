/*
  Warnings:

  - Added the required column `price` to the `wishlist_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `wishlist_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_productId_fkey";

-- AlterTable
ALTER TABLE "wishlist_items" ADD COLUMN     "imageUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "platform" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "price" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "productUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "productId" SET DATA TYPE TEXT;
