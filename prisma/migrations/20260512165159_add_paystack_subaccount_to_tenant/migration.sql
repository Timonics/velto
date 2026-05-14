/*
  Warnings:

  - A unique constraint covering the columns `[paystackSubaccountCode]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "paystackSubaccountCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_paystackSubaccountCode_key" ON "Tenant"("paystackSubaccountCode");
