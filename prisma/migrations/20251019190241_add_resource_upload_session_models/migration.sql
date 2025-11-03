-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'ZIP', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX', 'TXT', 'OTHER');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "CourseStatus" ADD VALUE 'UNDER_REVIEW';

-- AlterTable
ALTER TABLE "lectures" ADD COLUMN     "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "thumbnail" TEXT;

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "size" INTEGER NOT NULL,
    "lectureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "uploadedChunks" INTEGER NOT NULL DEFAULT 0,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "chunkHashes" TEXT[],
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resources_lectureId_idx" ON "resources"("lectureId");

-- CreateIndex
CREATE INDEX "upload_sessions_userId_idx" ON "upload_sessions"("userId");

-- CreateIndex
CREATE INDEX "upload_sessions_status_idx" ON "upload_sessions"("status");

-- CreateIndex
CREATE INDEX "upload_sessions_expiresAt_idx" ON "upload_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
