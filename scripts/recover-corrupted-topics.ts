import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

// One-time recovery: an interrupted run of tag-topics.ts (which classifies
// the WHOLE Question table) partially overwrote `topic` on several
// subtopic-wise imported test sets with its cruder keyword-based guesses,
// before it could be stopped. tag-topics.ts never touches `subtopic`, so for
// most sets the correct topic can be deterministically re-derived from the
// still-intact subtopic's unit-number prefix. Two sets had `subtopic` nulled
// out at import time (their source subtopic text equaled the topic name
// itself, so it was redundant) — those are recovered by re-matching against
// the original source workbook by question text instead.

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
};

const SUBTOPIC_TOPIC_OVERRIDE: Record<string, string> = {
  "1.2 Monera, Virus & Cyanobacteria": "Biodiversity",
  "1.3 Fungi, Lichens & Algae": "Biodiversity",
  "1.4 Bryophytes & Pteridophytes": "Biodiversity",
  "4.2 Water Relations, Mineral Nutrition & Transpiration": "Plant Physiology",
  "4.3 Photosynthesis": "Plant Physiology",
  "4.4 Respiration in Plants": "Plant Physiology",
  "7.3 Applied Botany — Tissue Culture, Genetic Engineering": "Applied Botany",
};

function topicFromSubtopic(exam: string, subject: string, subtopic: string): string | null {
  if (SUBTOPIC_TOPIC_OVERRIDE[subtopic]) return SUBTOPIC_TOPIC_OVERRIDE[subtopic];
  const order = TOPIC_ORDER[`${exam}::${subject}`];
  if (!order) return null;
  const unitNum = parseInt(subtopic.split(".")[0], 10);
  return order[unitNum - 1] ?? null;
}

async function recoverFromSubtopic(testId: string, exam: string, subject: string, label: string) {
  const rows = await prisma.question.findMany({ where: { testId }, select: { id: true, subtopic: true, topic: true } });
  let fixed = 0, skipped = 0;
  for (const r of rows) {
    if (!r.subtopic) { skipped++; continue; }
    const correctTopic = topicFromSubtopic(exam, subject, r.subtopic);
    if (!correctTopic) { skipped++; continue; }
    if (r.topic !== correctTopic) {
      await prisma.question.update({ where: { id: r.id }, data: { topic: correctTopic } });
      fixed++;
    }
  }
  console.log(`[${label}] restored ${fixed} rows, skipped ${skipped} (no subtopic or no mapping) out of ${rows.length}`);
}

async function recoverFromSourceFile(testId: string, exam: string, subject: string, filePath: string, label: string) {
  const wb = XLSX.readFile(filePath);
  const sourceRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  const textToTopic = new Map<string, string>();
  for (const row of sourceRows) {
    if (!row["Question"]) continue;
    const subtopicRaw = String(row["Sub-Topic"] ?? row["Sub-topic"] ?? "");
    const topic = topicFromSubtopic(exam, subject, subtopicRaw);
    if (topic) textToTopic.set(String(row["Question"]).trim(), topic);
  }

  const dbRows = await prisma.question.findMany({ where: { testId }, select: { id: true, text: true, topic: true } });
  let fixed = 0, unmatched = 0;
  for (const r of dbRows) {
    const correctTopic = textToTopic.get(r.text);
    if (!correctTopic) { unmatched++; continue; }
    if (r.topic !== correctTopic) {
      await prisma.question.update({ where: { id: r.id }, data: { topic: correctTopic } });
      fixed++;
    }
  }
  console.log(`[${label}] restored ${fixed} rows, ${unmatched} rows had no text match in source file, out of ${dbRows.length}`);
}

async function main() {
  await recoverFromSubtopic("cms9b8l3400005s6qhtw2ar8s", "IOE", "Physics", "IOE Physics");
  await recoverFromSubtopic("cms9f43dx0000o1cft911pxhg", "IOE", "Mathematics", "IOE Mathematics");
  await recoverFromSubtopic("cms9ljq2d000012ywiv2ygcis", "IOE", "Chemistry", "IOE Chemistry");
  await recoverFromSubtopic("cms9lktgm0000ok1csuuab513", "IOE", "English", "IOE English");
  await recoverFromSubtopic("cmsajs6600000gsqn44u5qxmb", "CEE", "Physics", "CEE Physics");
  await recoverFromSubtopic("cmsajssef0000qo2d8zczdw67", "CEE", "Chemistry", "CEE Chemistry");
  await recoverFromSubtopic("cmsakbvlb0000ro1oxj3b08lt", "CEE", "Botany", "CEE Botany (expanded)");

  await recoverFromSourceFile(
    "cms9mzsl70000re2yirbtzkh6", "CEE", "Zoology",
    "C:/Users/KIIT0001/Music/CEE_Zoology_MCQ_Subtopic_Wise.xlsx", "CEE Zoology"
  );
  await recoverFromSourceFile(
    "cms9mzi4g0000nro1jtu50c3b", "CEE", "Botany",
    "C:/Users/KIIT0001/Music/CEE_Botany_MCQ_Subtopic_Wise.xlsx", "CEE Botany (first)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
