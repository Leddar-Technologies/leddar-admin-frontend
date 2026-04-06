/*
  Warnings:

  - You are about to drop the column `contactInfo` on the `Brand` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Brand" DROP COLUMN "contactInfo",
ADD COLUMN     "description" TEXT;
