/*
  Warnings:

  - You are about to drop the column `acceptedTermsAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "acceptedTermsAt",
ADD COLUMN     "acceptedTerms" BOOLEAN NOT NULL DEFAULT false;
