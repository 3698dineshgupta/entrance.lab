import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

// Import a subtopic-wise MCQ workbook. Two source formats are supported:
//
//  A) One sheet per topic (sheet name = topic), with a "Sub-Topic" column
//     grouping rows into subtopic blocks (optionally with a bare divider
//     row before each block).
//  B) A single sheet covering a whole subject, with a "Sub-topic" column
//     whose value is prefixed with the official syllabus unit number (e.g.
//     "2.3 Sequence and Series..." belongs to unit 2). The topic is derived
//     by indexing into that subject's official topic order.
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

// Official syllabus unit order per exam+subject, for format (B) where the
// topic must be derived from the subtopic's leading unit number.
const TOPIC_ORDER: Record<string, string[]> = {
  "IOE::Mathematics": [
    "Set, Logic and Functions", "Algebra", "Trigonometry", "Coordinate Geometry",
    "Calculus", "Vectors and their Products", "Statistics and Probability",
  ],
  "IOE::Physics": [
    "Mechanics", "Heat and Thermodynamics", "Geometric and Physical Optics",
    "Waves and Sound", "Electricity & Magnetism", "Modern Physics",
  ],
  "IOE::Chemistry": ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"],
  "IOE::English": ["Grammar I", "Grammar II", "Phonetics", "Reading Comprehension"],
  "CEE::Zoology": [
    "Evolutionary Biology", "Animal Diversity and Classification", "Animal Tissues and Histology",
    "Study of Selected Animals", "Human Biology and Physiology", "Microbial Diseases and Immunology",
    "Medical Technology and Applied Biology", "Biota, Environment and Conservation",
  ],
  "CEE::Botany": [
    "Basic Components of Life", "Biodiversity", "Ecology and Vegetation", "Cell Biology",
    "Genetics", "Plant Anatomy", "Plant Physiology", "Developmental Botany", "Applied Botany",
  ],
  "CEE::Chemistry": ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry", "Applied Chemistry", "Analytical Chemistry"],
  "CEE::Physics": [
    "Mechanics", "Heat and Thermodynamics", "Waves and Optics",
    "Current Electricity and Magnetism", "Electrostatics and Capacitors", "Modern Physics",
  ],
  "CEE::MAT": ["Verbal Reasoning", "Numerical Reasoning", "Logical Sequencing", "Spatial Relation / Abstract Reasoning"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
}

function matchAnswerIndex(options: string[], answer: string): number {
  let idx = options.findIndex((o) => o === answer);
  if (idx === -1) {
    // Fallback for minor text drift between the Answer cell and its matching
    // option (e.g. an extra parenthetical annotation on one side only).
    idx = options.findIndex((o) => o.length > 0 && (answer.startsWith(o) || o.startsWith(answer)));
  }
  return idx;
}

function buildQuestion(testId: string, subject: string, topic: string, row: any) {
  const options = [row["Option A"], row["Option B"], row["Option C"], row["Option D"]].map((o) => String(o ?? "").trim());
  const answer = String(row["Answer"] ?? "").trim();
  const correctIndex = matchAnswerIndex(options, answer);
  if (correctIndex === -1) return { error: `answer "${answer}" not found in options` as string };

  const subtopicRaw = row["Sub-Topic"] ?? row["Sub-topic"] ?? row["Subtopic"];
  const subtopicText = subtopicRaw ? String(subtopicRaw).replace(/^\d+(\.\d+)?\.?\s*/, "").trim() : null;
  // Some sources use the Sub-Topic column to carry the top-level topic itself
  // (e.g. "5. Human Biology & Physiology") rather than a finer subtopic —
  // storing that as-is would just duplicate the topic name in the UI.
  const isRedundant = subtopicText && normalize(subtopicText) === normalize(topic);
  return {
    question: {
      testId,
      subject,
      topic,
      subtopic: isRedundant ? null : (subtopicRaw ? String(subtopicRaw).trim() : null),
      text: String(row["Question"]).trim(),
      options,
      correctIndex,
      explanation: row["Explanation"] ? String(row["Explanation"]).trim() : null,
      difficulty: "medium",
      marks: 1,
      negativeMarks: 0,
    },
  };
}

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
  const toCreateAll: any[] = [];

  // Detect format B: a single sheet whose Sub-Topic values carry a leading
  // "N." unit number instead of the topic being the sheet name.
  const firstSheetRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  const firstSubtopic = firstSheetRows.find((r) => r["Sub-Topic"] ?? r["Sub-topic"])?.["Sub-Topic"] ?? firstSheetRows.find((r) => r["Sub-topic"])?.["Sub-topic"];
  const isNumberPrefixedFormat = wb.SheetNames.length === 1 && typeof firstSubtopic === "string" && /^\d+\./.test(firstSubtopic);

  if (isNumberPrefixedFormat) {
    const order = TOPIC_ORDER[`${exam}::${subject}`];
    if (!order) {
      console.error(`No official topic order known for ${exam}::${subject} — cannot derive topics from unit numbers. Add it to TOPIC_ORDER.`);
      process.exit(1);
    }
    for (const row of firstSheetRows) {
      if (!row["Question"]) { skippedHeader++; continue; }
      const subtopicRaw = String(row["Sub-Topic"] ?? row["Sub-topic"] ?? "");
      const unitNum = parseInt(subtopicRaw.split(".")[0], 10);
      const topic = order[unitNum - 1];
      if (!topic) {
        console.warn(`  Unit number ${unitNum} (from "${subtopicRaw}") out of range for ${exam}::${subject} — skipping`);
        skippedBadAnswer++;
        continue;
      }
      const result = buildQuestion(testSet!.id, subject, topic, row);
      if (result.error) {
        console.warn(`  Row ${row["S.N."] ?? "?"}: ${result.error} — skipping`);
        skippedBadAnswer++;
        continue;
      }
      toCreateAll.push(result.question);
    }
  } else {
    const officialTopics = TOPIC_ORDER[`${exam}::${subject}`] ?? [];
    for (const sheetName of wb.SheetNames) {
      // Prefer an exact match against the official topic list (e.g. a sheet
      // literally named "Physical Chemistry"); fall back to the manual alias
      // dictionary for sheets named differently (e.g. "Optics" for
      // "Geometric and Physical Optics").
      const topic = officialTopics.find((t) => t === sheetName) ?? SHEET_TO_TOPIC[sheetName];
      if (!topic) {
        console.warn(`  No topic mapping for sheet "${sheetName}" — skipping`);
        continue;
      }
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      let sheetCount = 0;
      for (const row of rows) {
        if (!row["Question"]) { skippedHeader++; continue; } // bare Sub-Topic divider row
        const result = buildQuestion(testSet!.id, subject, topic, row);
        if (result.error) {
          console.warn(`  [${sheetName}] Q${row["Q.No"]}: ${result.error} — skipping`);
          skippedBadAnswer++;
          continue;
        }
        toCreateAll.push(result.question);
        sheetCount++;
      }
      if (sheetCount > 0) console.log(`  [${sheetName}] -> "${topic}": ${sheetCount} questions`);
    }
  }

  if (toCreateAll.length > 0) {
    await prisma.question.createMany({ data: toCreateAll });
    created = toCreateAll.length;
  }

  console.log(`\nDone. Created ${created} questions. Skipped ${skippedHeader} header rows, ${skippedBadAnswer} rows with unmatched answers/units.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
