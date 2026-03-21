/*
  Warnings:

  - Added the required column `updatedAt` to the `Attachment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "accessLevel" TEXT NOT NULL DEFAULT 'internal',
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN     "dataYear" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "isLatest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linkProvider" TEXT,
ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'document',
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'upload',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "thumbnailPath" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validUntil" TIMESTAMP(3),
ADD COLUMN     "version" TEXT DEFAULT '1.0',
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CompetitorDetail" ADD COLUMN     "country" TEXT,
ADD COLUMN     "countryCode" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Attachment_mediaType_category_idx" ON "Attachment"("mediaType", "category");

-- CreateIndex
CREATE INDEX "Attachment_isLatest_idx" ON "Attachment"("isLatest");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");
