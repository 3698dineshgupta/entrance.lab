import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

async function updateCeeMarks() {
  console.log("Updating CEE questions marks and negative marks...");
  const ceeTests = await prisma.testSet.findMany({
    where: { exam: "CEE" }
  });

  const ceeTestIds = ceeTests.map(t => t.id);

  const res = await prisma.question.updateMany({
    where: { testId: { in: ceeTestIds } },
    data: {
      marks: 1,
      negativeMarks: 0.25
    }
  });
  console.log(`Updated ${res.count} CEE questions with marks=1 and negativeMarks=0.25`);
}

async function addIoeTest() {
  const title = "IOE Full Mock Test — Set 1";
  
  // Find existing IOE Set 1 (which only has 8 questions from static seed)
  const existingSet = await prisma.testSet.findFirst({
    where: { title }
  });

  if (existingSet) {
    console.log(`Found existing "${title}". Deleting it to replace with full Excel file...`);
    await prisma.testSet.delete({
      where: { id: existingSet.id }
    });
  }

  console.log(`Parsing IOE Excel file...`);
  const filePath = 'C:\\Users\\KIIT0001\\Downloads\\IOE_2080_Syllabus_Question_Set.xlsx';
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const questions = data.map((row: any) => {
    const options = [
      String(row['Option A'] || 'A'),
      String(row['Option B'] || 'B'),
      String(row['Option C'] || 'C'),
      String(row['Option D'] || 'D')
    ];
    
    const answerRaw = String(row['Answer'] || row['Correct Option'] || '').trim();
    let correctIndex = options.findIndex(opt => opt.trim() === answerRaw);
    
    if (correctIndex === -1) {
      if (answerRaw.startsWith('A')) correctIndex = 0;
      else if (answerRaw.startsWith('B')) correctIndex = 1;
      else if (answerRaw.startsWith('C')) correctIndex = 2;
      else if (answerRaw.startsWith('D')) correctIndex = 3;
      else correctIndex = 0;
    }

    // IOE usually has different marks (some 1 mark, some 2 marks)
    // We will try to parse marks from the excel if it exists, else default to 1.
    const marks = row['Marks'] ? parseInt(row['Marks'], 10) : 1;
    // IOE negative marking is 10% (so 0.1 for 1 mark, 0.2 for 2 marks)
    const negativeMarks = marks * 0.1;

    return {
      subject: row['Subject'] || 'Physics',
      text: row['Question'] || 'Missing question text',
      options,
      correctIndex,
      marks: marks,
      negativeMarks: negativeMarks,
      difficulty: "medium"
    };
  });

  const testSet = await prisma.testSet.create({
    data: {
      title,
      exam: "IOE",
      mode: "full",
      difficulty: "mixed",
      durationMinutes: 120, // IOE is usually 120 mins
      isPublished: true,
      questions: {
        create: questions
      }
    }
  });

  console.log(`Successfully created "${title}" with ${questions.length} questions!`);
}

async function main() {
  await updateCeeMarks();
  await addIoeTest();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
