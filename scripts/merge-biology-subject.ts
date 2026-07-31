import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// One-time fix: the official CEE syllabus has no combined "Biology" subject —
// only separate "Botany" and "Zoology" units. One uploaded test set ("CEE
// Full Mock Test — Set 2") used "Biology" as shorthand instead of splitting
// the content, which showed up as a confusing third subject in the practice
// browser. Since every question under "Biology" already has a `topic` that
// matches exactly one official Botany or Zoology unit name (see
// scripts/tag-topics.ts), we can reassign `subject` deterministically from
// `topic` with no re-classification needed.
const BOTANY_TOPICS = new Set([
  "Basic Components of Life", "Biodiversity", "Ecology and Vegetation",
  "Cell Biology", "Genetics", "Plant Anatomy", "Plant Physiology",
  "Developmental Botany", "Applied Botany",
]);
const ZOOLOGY_TOPICS = new Set([
  "Evolutionary Biology", "Animal Diversity and Classification",
  "Animal Tissues and Histology", "Study of Selected Animals",
  "Human Biology and Physiology", "Microbial Diseases and Immunology",
  "Medical Technology and Applied Biology", "Biota, Environment and Conservation",
]);

async function main() {
  const questions = await prisma.question.findMany({
    where: { subject: "Biology" },
    select: { id: true, topic: true },
  });
  console.log(`Found ${questions.length} questions with subject "Biology"`);

  const counts: Record<string, number> = {};
  for (const q of questions) {
    let newSubject: string;
    if (q.topic && BOTANY_TOPICS.has(q.topic)) newSubject = "Botany";
    else if (q.topic && ZOOLOGY_TOPICS.has(q.topic)) newSubject = "Zoology";
    else {
      console.warn(`  Unmapped topic "${q.topic}" on question ${q.id} — leaving as Biology`);
      continue;
    }
    counts[newSubject] = (counts[newSubject] ?? 0) + 1;
    await prisma.question.update({ where: { id: q.id }, data: { subject: newSubject } });
  }

  console.log("Reassigned:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
