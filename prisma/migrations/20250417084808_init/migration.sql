/*
  Warnings:

  - You are about to drop the column `slug` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `post` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_slug_key";

-- AlterTable
ALTER TABLE "post" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "slug";

-- CreateIndex
CREATE UNIQUE INDEX "post_slug_key" ON "post"("slug");
