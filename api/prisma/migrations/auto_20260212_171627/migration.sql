-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "name" TEXT;
