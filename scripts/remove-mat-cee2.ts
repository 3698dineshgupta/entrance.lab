import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const set2 = await prisma.testSet.findFirst({
    where: { title: "CEE Full Mock Test — Set 2" }
  });

  if (!set2) {
    console.error("Set 2 not found!");
    return;
  }

  const { count } = await prisma.question.deleteMany({
    where: {
      testId: set2.id,
      subject: "MAT"
    }
  });

  console.log(`Deleted ${count} MAT questions from CEE Set 2.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
