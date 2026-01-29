-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scales" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "service" TEXT NOT NULL,

    CONSTRAINT "scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_members" (
    "id" TEXT NOT NULL,
    "scaleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,

    CONSTRAINT "scale_members_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scale_members" ADD CONSTRAINT "scale_members_scaleId_fkey" FOREIGN KEY ("scaleId") REFERENCES "scales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_members" ADD CONSTRAINT "scale_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
