const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Load DTO
const dtoPath = path.join(__dirname, 'test-output', 'test-dto.json');
const dto = JSON.parse(fs.readFileSync(dtoPath, 'utf8'));

// Load generated DOCX
const docxPath = path.join(__dirname, 'test-output', 'test-18036be5-dadb-f011-8544-6045bd69d7d8.docx');
const content = fs.readFileSync(docxPath, 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip);
const fullText = doc.getFullText();

console.log('=== ACTION 2 FINAL VALIDATION ===');
console.log('');

// Extract specific sections to verify Yes/No rendering
const sections = [
  {
    title: '2. DIFC DISCLOSURE',
    start: 'DIFC DISCLOSURE',
    end: '3. FIRM INFORMATION',
    dtoValue: dto.DIFCDisclosure.ConsentToDisclosure
  },
  {
    title: '6. APPLICANT INFORMATION',
    start: 'APPLICANT INFORMATION',
    end: '7. CANDIDATE IDENTITY',
    dtoValue: dto.Flags.RepOffice
  },
  {
    title: '7. CANDIDATE IDENTITY',
    start: 'CANDIDATE IDENTITY',
    end: '8. CANDIDATE PASSPORT',
    dtoValue: dto.Flags.PreviouslyHeld
  },
  {
    title: '9. CANDIDATE OTHER NAMES',
    start: 'OTHER NAMES',
    end: '10. CANDIDATE CITIZENSHIP',
    dtoValue: dto.Flags.OtherNames
  }
];

sections.forEach(section => {
  const regex = new RegExp(section.start + '([\\s\\S]{0,300})' + section.end);
  const match = fullText.match(regex);

  if (match) {
    const sectionText = match[1].trim();
    const hasYes = sectionText.includes('Yes');
    const hasNo = sectionText.includes('No');
    const expected = section.dtoValue ? 'Yes' : 'No';
    const found = hasYes ? 'Yes' : (hasNo ? 'No' : 'NONE');
    const isCorrect = found === expected;

    console.log((isCorrect ? '✅' : '❌') + ' ' + section.title);
    console.log('   DTO: ' + section.dtoValue + ' → Expected: ' + expected);
    console.log('   Rendered: ' + found);
    console.log('   Section text: ' + sectionText.substring(0, 150).replace(/\\n/g, ' '));
    console.log('');
  }
});
