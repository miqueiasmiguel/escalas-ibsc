-- AlterTable
ALTER TABLE "scale_members" ALTER COLUMN "memberId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "scale_templates" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "instruments" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scale_templates_pkey" PRIMARY KEY ("id")
);
