const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const testSets = await p.testSet.findMany({
    include: { _count: { select: { questions: true } } }
  });
  console.log('Total test sets:', testSets.length);
  testSets.forEach(t => {
    console.log(`- [${t.id}] "${t.title}" | exam=${t.exam} | published=${t.isPublished} | questions=${t._count.questions}`);
  });
}

main().catch(console.error).finally(() => p.$disconnect());
