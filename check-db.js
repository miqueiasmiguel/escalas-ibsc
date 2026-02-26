const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const unavailabilities = await prisma.memberUnavailability.findMany({
    include: { member: true },
  });
  console.log("Unavailabilities:", JSON.stringify(unavailabilities, null, 2));

  const scales = await prisma.scaleEntry.findMany({
    include: { members: { include: { member: true } } },
  });
  console.log("Scales:", JSON.stringify(scales, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
