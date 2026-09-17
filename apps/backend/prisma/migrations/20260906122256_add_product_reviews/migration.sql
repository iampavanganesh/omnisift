-- AlterTable
ALTER TABLE "products" ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "ratingBreakdown" JSONB,
ADD COLUMN     "reviewCount" INTEGER,
ADD COLUMN     "reviews" JSONB;
