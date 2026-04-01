/*
  Warnings:

  - The values [FULL] on the enum `PaymentStage` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bucket` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `flatFee` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reference]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `specialty` on the `Artisan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ArtisanSpecialty" AS ENUM ('BAGS', 'WALLETS', 'BELTS', 'SHOES', 'JACKETS');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStage_new" AS ENUM ('SAMPLE_FLAT_FEE', 'MATERIAL', 'SERVICE', 'FULL_PAYMENT');
ALTER TABLE "Payment" ALTER COLUMN "stage" TYPE "PaymentStage_new" USING ("stage"::text::"PaymentStage_new");
ALTER TYPE "PaymentStage" RENAME TO "PaymentStage_old";
ALTER TYPE "PaymentStage_new" RENAME TO "PaymentStage";
DROP TYPE "public"."PaymentStage_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Artisan" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "yearsOfExperience" INTEGER,
DROP COLUMN "specialty",
ADD COLUMN     "specialty" "ArtisanSpecialty" NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "BankDetail" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Brand" ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "File" DROP COLUMN "bucket";

-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "status" SET DEFAULT 'ASSIGNED';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "balance",
DROP COLUMN "flatFee",
ADD COLUMN     "escrowBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "flatFeePaid" DOUBLE PRECISION,
ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PortfolioImage" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
