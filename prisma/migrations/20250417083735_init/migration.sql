/*
  Warnings:

  - You are about to drop the column `slug` on the `post` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "post_slug_key";

-- AlterTable
ALTER TABLE "post" DROP COLUMN "slug";
