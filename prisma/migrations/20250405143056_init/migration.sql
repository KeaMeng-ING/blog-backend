-- AlterTable
ALTER TABLE "post" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;
