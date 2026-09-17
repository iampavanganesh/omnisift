-- AlterTable
ALTER TABLE "api_usage_logs" ADD COLUMN     "errorReason" TEXT,
ADD COLUMN     "httpStatus" INTEGER,
ADD COLUMN     "page" INTEGER,
ADD COLUMN     "resultCount" INTEGER;
