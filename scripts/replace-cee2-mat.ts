import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_MAT_QUESTIONS = [
  { text: "Find the odd one out:", options: ["Circle", "Ellipse", "Sphere", "Parabola"], correctIndex: 2 },
  { text: "If WATER is written as YCVGT, then what is written as HKTG?", options: ["FIRE", "EARTH", "AIR", "ICE"], correctIndex: 0 },
  { text: "Choose the next number in the series: 5, 11, 24, 51, 106, ?", options: ["217", "215", "117", "122"], correctIndex: 0 },
  { text: "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?", options: ["Mother", "Daughter", "Sister", "Grandmother"], correctIndex: 0 },
  { text: "A boy walks 10m towards South, turns right and walks 5m, turns right again and walks 10m. How far is he from his starting point?", options: ["5m", "10m", "15m", "20m"], correctIndex: 0 },
  { text: "Which word cannot be formed from the letters of the word 'RECREATION'?", options: ["RATION", "ACTION", "TORN", "REFER"], correctIndex: 1 },
  { text: "If + means *, * means -, - means /, and / means +, then what is 10 + 5 * 10 / 2 - 1?", options: ["42", "45", "50", "40"], correctIndex: 0 },
  { text: "In a row of 40 students, Rahul is 15th from the left. What is his position from the right?", options: ["24", "25", "26", "27"], correctIndex: 2 },
  { text: "Telescope is to Star as Microscope is to:", options: ["Lens", "Bacteria", "Science", "Doctor"], correctIndex: 1 },
  { text: "Look at this series: 80, 10, 70, 15, 60, ... What number should come next?", options: ["20", "25", "30", "50"], correctIndex: 0 },
  { text: "Which fraction comes next in the sequence 1/2, 3/4, 5/8, 7/16, ?", options: ["9/32", "10/17", "11/34", "12/35"], correctIndex: 0 },
  { text: "If day before yesterday was Tuesday, the day after tomorrow will be:", options: ["Friday", "Saturday", "Sunday", "Monday"], correctIndex: 1 },
  { text: "A family consists of a grandfather, grandmother, 2 fathers, 2 mothers, 4 children, 3 grandchildren, 1 brother, 2 sisters, 2 sons, 2 daughters, 1 father-in-law, 1 mother-in-law, and 1 daughter-in-law. What is the minimum number of members in the family?", options: ["15", "11", "7", "23"], correctIndex: 2 },
  { text: "At what angle the hands of a clock are inclined at 15 minutes past 5?", options: ["58.5 degrees", "64 degrees", "67.5 degrees", "72.5 degrees"], correctIndex: 2 },
  { text: "Which of the following is different from the others?", options: ["Rigveda", "Yajurveda", "Atharvaveda", "Ayurveda"], correctIndex: 3 },
  { text: "Find the missing letters in the series: SCD, TEF, UGH, ___, WKL", options: ["CMN", "UJI", "VIJ", "IJT"], correctIndex: 2 },
  { text: "A train 360 m long is running at a speed of 45 km/hr. What time will it take to cross a 140 m long bridge?", options: ["40 sec", "45 sec", "50 sec", "55 sec"], correctIndex: 0 },
  { text: "If RED is coded as 6720, then how would GREEN be coded?", options: ["1677209", "1677199", "16717209", "9207716"], correctIndex: 0 },
  { text: "Statement: All pens are frogs. Some frogs are birds. Conclusion: Some pens are birds.", options: ["True", "False", "Probably True", "Probably False"], correctIndex: 1 },
  { text: "A cube is painted red on all sides. It is then cut into 27 smaller cubes of equal size. How many small cubes are painted on 2 sides only?", options: ["8", "12", "16", "24"], correctIndex: 1 },
].map(q => ({ ...q, subject: "MAT", difficulty: "medium", marks: 1 }));

async function main() {
  const set2 = await prisma.testSet.findFirst({
    where: { title: "CEE Full Mock Test — Set 2" }
  });

  if (!set2) {
    console.error("Set 2 not found!");
    return;
  }

  // 1. Delete the existing MAT questions from Set 2
  const { count } = await prisma.question.deleteMany({
    where: {
      testId: set2.id,
      subject: "MAT"
    }
  });

  console.log(`Deleted ${count} duplicated MAT questions from CEE Set 2.`);

  // 2. Add the 20 fresh MAT questions to Set 2
  await prisma.testSet.update({
    where: { id: set2.id },
    data: {
      questions: {
        create: NEW_MAT_QUESTIONS
      }
    }
  });

  console.log("Successfully added 20 BRAND NEW MAT questions to CEE Set 2.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
