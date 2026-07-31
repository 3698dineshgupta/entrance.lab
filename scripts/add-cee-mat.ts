import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const MAT_QUESTIONS = [
  { text: "Find the missing number in the series: 2, 6, 12, 20, ?", options: ["28", "30", "32", "36"], correctIndex: 1 },
  { text: "If 'APPLE' is coded as 'EQTPI', how is 'MANGO' coded?", options: ["QERKS", "QERLS", "PERKS", "QEQKS"], correctIndex: 0 },
  { text: "A man walks 5 km East, then turns right and walks 3 km. He turns right again and walks 5 km. Which direction is he facing now?", options: ["North", "South", "East", "West"], correctIndex: 3 },
  { text: "Look at this series: 36, 34, 30, 28, 24, ... What number should come next?", options: ["20", "22", "23", "26"], correctIndex: 1 },
  { text: "Cup is to coffee as bowl is to:", options: ["Dish", "Soup", "Spoon", "Food"], correctIndex: 1 },
  { text: "Odometer is to mileage as compass is to:", options: ["Speed", "Hiking", "Needle", "Direction"], correctIndex: 3 },
  { text: "Choose the odd one out:", options: ["Apple", "Mango", "Potato", "Orange"], correctIndex: 2 },
  { text: "If A is the brother of B; B is the sister of C; and C is the father of D, how D is related to A?", options: ["Brother", "Sister", "Nephew", "Cannot be determined"], correctIndex: 3 },
  { text: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?", options: ["Brother", "Uncle", "Cousin", "Father"], correctIndex: 3 },
  { text: "What comes next in the sequence: AZ, CX, EV, ?", options: ["GT", "GS", "HT", "HU"], correctIndex: 0 },
  { text: "Which word does NOT belong with the others?", options: ["Violin", "Flute", "Cello", "Guitar"], correctIndex: 1 },
  { text: "A clock is started at noon. By 10 minutes past 5, the hour hand has turned through:", options: ["145°", "150°", "155°", "160°"], correctIndex: 2 },
  { text: "The day before yesterday was Thursday. When will Sunday be?", options: ["Today", "Tomorrow", "Day after tomorrow", "Two days after tomorrow"], correctIndex: 1 },
  { text: "If 1 = 3, 2 = 3, 3 = 5, 4 = 4, 5 = 4. Then 6 = ?", options: ["2", "3", "4", "5"], correctIndex: 1 },
  { text: "How many triangles are there in a star of David (hexagram)?", options: ["6", "8", "10", "12"], correctIndex: 1 },
  { text: "A train 120 meters long is running with a speed of 60 km/hr. In what time will it pass a boy who is running at 6 km/hr in the direction opposite to that in which the train is going?", options: ["6.54 sec", "44.32 sec", "55 sec", "30.2 sec"], correctIndex: 0 },
  { text: "Select the related word: Disease : Pathology :: Planet : ?", options: ["Astrology", "Geology", "Astronomy", "Palaeontology"], correctIndex: 2 },
  { text: "Which number replaces the question mark? 1, 9, 25, 49, ?, 121", options: ["64", "81", "91", "100"], correctIndex: 1 },
  { text: "If South-East becomes North, North-East becomes West and so on. What will West become?", options: ["North-East", "North-West", "South-East", "South-West"], correctIndex: 2 },
  { text: "Choose the word which is least like the other words in the group.", options: ["Zebra", "Lion", "Tiger", "Horse"], correctIndex: 3 },
].map(q => ({ ...q, subject: "MAT", difficulty: "medium", marks: 1 }));

async function addMatToSet1() {
  const set1 = await prisma.testSet.findFirst({
    where: { title: "CEE Full Mock Test — Set 1" }
  });

  if (!set1) {
    console.error("Set 1 not found!");
    return;
  }

  const existingMat = await prisma.question.count({
    where: { testId: set1.id, subject: "MAT" }
  });

  if (existingMat === 0) {
    await prisma.testSet.update({
      where: { id: set1.id },
      data: {
        questions: {
          create: MAT_QUESTIONS
        }
      }
    });
    console.log("Added 20 MAT questions to CEE Set 1.");
  } else {
    console.log("CEE Set 1 already has MAT questions.");
  }
}

async function addCeeSet2() {
  const existingSet2 = await prisma.testSet.findFirst({
    where: { title: "CEE Full Mock Test — Set 2" }
  });

  if (existingSet2) {
    console.log("CEE Set 2 already exists in the database.");
    return;
  }

  const filePath = 'C:\\Users\\KIIT0001\\AppData\\Local\\Packages\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\\LocalState\\sessions\\1BC665888EA0EE653B663B62F1B8B00D7F1573E7\\transfers\\2026-31\\cee2.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const questions = data.map((row) => {
    const options = [
      String(row['Option A'] || 'A'),
      String(row['Option B'] || 'B'),
      String(row['Option C'] || 'C'),
      String(row['Option D'] || 'D')
    ];
    
    // The Answer column contains the literal string of the correct option
    const answerRaw = String(row['Answer'] || '').trim();
    let correctIndex = options.findIndex(opt => opt.trim() === answerRaw);
    
    // Fallback if exact match fails
    if (correctIndex === -1) {
      if (answerRaw.startsWith('A')) correctIndex = 0;
      else if (answerRaw.startsWith('B')) correctIndex = 1;
      else if (answerRaw.startsWith('C')) correctIndex = 2;
      else if (answerRaw.startsWith('D')) correctIndex = 3;
      else correctIndex = 0; // fallback to A
    }

    return {
      subject: row['Subject'] || 'Physics',
      text: row['Question'] || 'Missing question text',
      options,
      correctIndex,
      marks: 1,
      difficulty: "medium"
    };
  });

  // Combine with MAT questions
  const allQuestions = [...questions, ...MAT_QUESTIONS];

  const testSet = await prisma.testSet.create({
    data: {
      title: "CEE Full Mock Test — Set 2",
      exam: "CEE",
      mode: "full",
      difficulty: "mixed",
      durationMinutes: 180,
      isPublished: true,
      questions: {
        create: allQuestions
      }
    }
  });

  console.log(`Created CEE Set 2 with ${allQuestions.length} questions (including 20 MAT).`);
}

async function main() {
  await addMatToSet1();
  await addCeeSet2();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
