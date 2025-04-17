/*
  Warnings:

  - Made the column `slug` on table `post` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "post" ALTER COLUMN "slug" SET NOT NULL;
