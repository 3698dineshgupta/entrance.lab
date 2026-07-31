import { PrismaClient } from "@prisma/client";
import { MOCK_TESTS } from "../lib/questions";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with original mock tests...");

  for (const test of MOCK_TESTS) {
    const existing = await prisma.testSet.findFirst({
      where: { title: test.title }
    });

    if (existing) {
      console.log(`Skipping "${test.title}" - already exists`);
      continue;
    }

    const testSet = await prisma.testSet.create({
      data: {
        title: test.title,
        exam: test.exam,
        mode: test.mode || "full",
        difficulty: test.difficulty || "mixed",
        durationMinutes: test.durationMinutes || 180,
        isPublished: true,
        questions: {
          create: test.questions.map((q) => ({
            subject: q.subject,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            difficulty: q.difficulty,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
          })),
        },
      },
    });
    console.log(`Created: ${testSet.title} with ${test.questions.length} questions`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
