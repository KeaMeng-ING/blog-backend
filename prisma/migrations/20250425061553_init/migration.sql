/*
  Warnings:

  - You are about to drop the column `bio` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "bio",
ADD COLUMN     "bioProfile" TEXT DEFAULT 'This user has no bio';
