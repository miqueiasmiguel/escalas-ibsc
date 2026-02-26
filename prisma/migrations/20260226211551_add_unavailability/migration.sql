-- CreateTable
CREATE TABLE "member_unavailabilities" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_unavailabilities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "member_unavailabilities" ADD CONSTRAINT "member_unavailabilities_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
