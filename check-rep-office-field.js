const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Load generated DOCX
const docxPath = path.join(__dirname, 'test-output', 'conditional-test.docx');
const content = fs.readFileSync(docxPath, 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip);
const fullText = doc.getFullText();

// Extract Section 6 - Applicant Information
const section6Pattern = /6\. APPLICANT INFORMATION(.{0,500}?)7\./s;
const section6Match = fullText.match(section6Pattern);

console.log('=== ISSUE 1 VALIDATION: Rep Office Functions Field ===');
console.log('');

if (section6Match) {
  const content = section6Match[1];
  console.log('Section 6 Content:');
  console.log(content.substring(0, 400));
  console.log('');

  const hasPrincipalRep = content.includes('Principal Representative');
  console.log(hasPrincipalRep ? '✅' : '❌', 'Rep Office Functions value present:', hasPrincipalRep);

  if (hasPrincipalRep) {
    console.log('');
    console.log('✅ ISSUE 1 RESOLVED');
    console.log('   "Please indicate the function(s)..." now shows: Principal Representative');
  }
} else {
  console.log('❌ Section 6 not found');
}
