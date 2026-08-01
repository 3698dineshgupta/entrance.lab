import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

// Import a flat, single-sheet full mock test: Question / Option A-D / Answer
// / Subject columns, no topic or subtopic tagging. Published as a real timed
// mock test (unlike scripts/import-subtopic-mcqs.ts's unpublished practice
// banks). Run scripts/tag-topics.ts afterward to backfill topic
// classification so this content also surfaces in the practice feature.
//
// Usage: npx tsx scripts/import-full-mocktest.ts <path-to-xlsx> <exam> <title> <durationMinutes>

function matchAnswerIndex(options: string[], answer: string): number {
  // Some source files prefix the answer with its own option letter, e.g.
  // "D) Cavity of stomach of mosquito" — strip that before comparing.
  const stripped = answer.replace(/^[A-D]\)\s*/, "");
  let idx = options.findIndex((o) => o === stripped);
  if (idx === -1) {
    idx = options.findIndex((o) => o.length > 0 && (stripped.startsWith(o) || o.startsWith(stripped)));
  }
  return idx;
}

async function main() {
  const [filePath, exam, title, durationArg] = process.argv.slice(2);
  if (!filePath || !exam || !title) {
    console.error("Usage: npx tsx scripts/import-full-mocktest.ts <path-to-xlsx> <exam> <title> <durationMinutes>");
    process.exit(1);
  }
  const durationMinutes = durationArg ? parseInt(durationArg, 10) : 180;

  const wb = XLSX.readFile(filePath);
  const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(`Read ${rows.length} rows from "${wb.SheetNames[0]}"`);

  let testSet = await prisma.testSet.findFirst({ where: { title, exam } });
  if (testSet) {
    const existingCount = await prisma.question.count({ where: { testId: testSet.id } });
    if (existingCount > 0) {
      console.error(`TestSet ${testSet.id} ("${title}") already has ${existingCount} questions. Refusing to re-import. Delete them first or use a different title.`);
      process.exit(1);
    }
  } else {
    testSet = await prisma.testSet.create({
      data: { exam, title, mode: "full", difficulty: "mixed", durationMinutes, isPublished: true },
    });
    console.log(`Created TestSet ${testSet.id} ("${title}")`);
  }

  const toCreate: any[] = [];
  let skipped = 0;
  for (const row of rows) {
    if (!row["Question"]) continue;
    const options = [row["Option A"], row["Option B"], row["Option C"], row["Option D"]].map((o) => String(o ?? "").trim());
    const answer = String(row["Answer"] ?? "").trim();
    const correctIndex = matchAnswerIndex(options, answer);
    if (correctIndex === -1) {
      console.warn(`  Skipping "${String(row["Question"]).slice(0, 60)}..." — answer "${answer}" not found in options`);
      skipped++;
      continue;
    }
    toCreate.push({
      testId: testSet!.id,
      subject: row["Subject"] || "General",
      text: String(row["Question"]).trim(),
      options,
      correctIndex,
      explanation: row["Explanation"] ? String(row["Explanation"]).trim() : null,
      difficulty: "medium",
      marks: 1,
      negativeMarks: 0.25,
    });
  }

  if (toCreate.length > 0) {
    await prisma.question.createMany({ data: toCreate });
  }
  console.log(`\nDone. Created ${toCreate.length} questions. Skipped ${skipped} rows with unmatched answers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
