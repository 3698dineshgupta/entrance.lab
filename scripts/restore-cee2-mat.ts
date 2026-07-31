import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

async function main() {
  const set2 = await prisma.testSet.findFirst({
    where: { title: "CEE Full Mock Test — Set 2" }
  });

  if (!set2) {
    console.error("Set 2 not found!");
    return;
  }

  const filePath = 'C:\\Users\\KIIT0001\\AppData\\Local\\Packages\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\\LocalState\\sessions\\1BC665888EA0EE653B663B62F1B8B00D7F1573E7\\transfers\\2026-31\\cee2.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const matQuestionsFromExcel = data
    .filter((row: any) => String(row['Subject'] || '').toUpperCase() === 'MAT' || String(row['Subject'] || '').toUpperCase().includes('MENTAL'))
    .map((row: any) => {
      const options = [
        String(row['Option A'] || 'A'),
        String(row['Option B'] || 'B'),
        String(row['Option C'] || 'C'),
        String(row['Option D'] || 'D')
      ];
      
      const answerRaw = String(row['Answer'] || '').trim();
      let correctIndex = options.findIndex(opt => opt.trim() === answerRaw);
      
      if (correctIndex === -1) {
        if (answerRaw.startsWith('A')) correctIndex = 0;
        else if (answerRaw.startsWith('B')) correctIndex = 1;
        else if (answerRaw.startsWith('C')) correctIndex = 2;
        else if (answerRaw.startsWith('D')) correctIndex = 3;
        else correctIndex = 0;
      }

      return {
        subject: "MAT",
        text: row['Question'] || 'Missing question text',
        options,
        correctIndex,
        marks: 1,
        difficulty: "medium"
      };
    });

  if (matQuestionsFromExcel.length === 0) {
    console.log("Could not find any MAT questions in the Excel file!");
    return;
  }

  console.log(`Found ${matQuestionsFromExcel.length} MAT questions in Excel. Adding them back...`);

  await prisma.testSet.update({
    where: { id: set2.id },
    data: {
      questions: {
        create: matQuestionsFromExcel
      }
    }
  });

  console.log("Successfully restored the original MAT questions from the uploaded file to Set 2.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
