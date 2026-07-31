import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

// Import a subtopic-wise MCQ workbook: one sheet per topic, a "Sub-Topic"
// column grouping rows into subtopic blocks (with a bare divider row before
// each block), and Question/Option A-D/Answer/Explanation columns.
//
// Usage: npx tsx scripts/import-subtopic-mcqs.ts <path-to-xlsx> <exam> <subject> [testTitle]

const SHEET_TO_TOPIC: Record<string, string> = {
  "Mechanics": "Mechanics",
  "Heat & Thermodynamics": "Heat and Thermodynamics",
  "Optics": "Geometric and Physical Optics",
  "Waves & Sound": "Waves and Sound",
  "Electricity & Magnetism": "Electricity & Magnetism",
  "Modern Physics": "Modern Physics",
  // CEE Physics uses a different unit structure (combines Waves+Optics,
  // splits Electrostatics from Current Electricity & Magnetism) — map if a
  // CEE workbook uses these sheet names too.
  "Waves & Optics": "Waves and Optics",
  "Current Electricity & Magnetism": "Current Electricity and Magnetism",
  "Electrostatics & Capacitors": "Electrostatics and Capacitors",
};

async function main() {
  const [filePath, exam, subject, testTitleArg] = process.argv.slice(2);
  if (!filePath || !exam || !subject) {
    console.error("Usage: npx tsx scripts/import-subtopic-mcqs.ts <path-to-xlsx> <exam> <subject> [testTitle]");
    process.exit(1);
  }
  const testTitle = testTitleArg || `${exam} ${subject} — Subtopic Practice Bank`;

  const wb = XLSX.readFile(filePath);
  console.log(`Sheets: ${wb.SheetNames.join(", ")}`);

  let testSet = await prisma.testSet.findFirst({ where: { title: testTitle, exam } });
  if (!testSet) {
    testSet = await prisma.testSet.create({
      data: {
        exam,
        title: testTitle,
        mode: "subject",
        subject,
        difficulty: "mixed",
        durationMinutes: 0,
        // Unpublished: excluded from Mock Tests listing, still fully
        // queryable by the practice feature (which doesn't filter on this).
        isPublished: false,
      },
    });
    console.log(`Created TestSet ${testSet.id} ("${testTitle}")`);
  } else {
    const existingCount = await prisma.question.count({ where: { testId: testSet.id } });
    if (existingCount > 0) {
      console.error(`TestSet ${testSet.id} ("${testTitle}") already has ${existingCount} questions. Refusing to re-import (would duplicate). Delete them first or use a different title.`);
      process.exit(1);
    }
    console.log(`Reusing existing empty TestSet ${testSet.id} ("${testTitle}")`);
  }

  let created = 0, skippedHeader = 0, skippedBadAnswer = 0;

  for (const sheetName of wb.SheetNames) {
    const topic = SHEET_TO_TOPIC[sheetName];
    if (!topic) {
      console.warn(`  No topic mapping for sheet "${sheetName}" — skipping`);
      continue;
    }
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
    const toCreate: any[] = [];

    for (const row of rows) {
      const questionText = row["Question"];
      if (!questionText) { skippedHeader++; continue; } // bare Sub-Topic divider row

      const options = [row["Option A"], row["Option B"], row["Option C"], row["Option D"]].map((o) => String(o ?? "").trim());
      const answer = String(row["Answer"] ?? "").trim();
      let correctIndex = options.findIndex((o) => o === answer);
      // Fallback for minor text drift between the Answer cell and its
      // matching option (e.g. an extra parenthetical annotation appended
      // to Answer but not present in the option text).
      if (correctIndex === -1) {
        correctIndex = options.findIndex((o) => o.length > 0 && (answer.startsWith(o) || o.startsWith(answer)));
      }
      if (correctIndex === -1) {
        console.warn(`  [${sheetName}] Q${row["Q.No"]}: answer "${answer}" not found in options — skipping`);
        skippedBadAnswer++;
        continue;
      }

      toCreate.push({
        testId: testSet!.id,
        subject,
        topic,
        subtopic: row["Sub-Topic"] ? String(row["Sub-Topic"]).trim() : null,
        text: String(questionText).trim(),
        options,
        correctIndex,
        explanation: row["Explanation"] ? String(row["Explanation"]).trim() : null,
        difficulty: "medium",
        marks: 1,
        negativeMarks: 0,
      });
    }

    if (toCreate.length > 0) {
      await prisma.question.createMany({ data: toCreate });
      created += toCreate.length;
      console.log(`  [${sheetName}] -> "${topic}": ${toCreate.length} questions`);
    }
  }

  console.log(`\nDone. Created ${created} questions. Skipped ${skippedHeader} header rows, ${skippedBadAnswer} rows with unmatched answers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
