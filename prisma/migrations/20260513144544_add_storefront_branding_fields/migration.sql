-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "footerText" TEXT,
ADD COLUMN     "heroSubtitle" TEXT,
ADD COLUMN     "heroTitle" TEXT,
ADD COLUMN     "socialLinks" JSONB;
