-- AlterTable
ALTER TABLE "members" ADD COLUMN     "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "recurring_unavailabilities" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,

    CONSTRAINT "recurring_unavailabilities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "recurring_unavailabilities" ADD CONSTRAINT "recurring_unavailabilities_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
