const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('C:\\Users\\KIIT0001\\AppData\\Local\\Packages\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\\LocalState\\sessions\\1BC665888EA0EE653B663B62F1B8B00D7F1573E7\\transfers\\2026-31\\cee2.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('Headers:', data[0]);
  console.log('Row 1:', data[1]);
} catch (e) {
  console.error('Error reading file:', e.message);
}
