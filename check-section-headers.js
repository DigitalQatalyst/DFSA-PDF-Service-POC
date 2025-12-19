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

// Find all section headers (pattern: "## .")
const sections = fullText.match(/\d+\.\s+[A-Z\s]+/g);

console.log('=== Section Headers in Generated Output ===');
console.log('');
sections.forEach(section => {
  console.log(section.trim());
});

// Check specific conditional sections
console.log('');
console.log('=== Conditional Section Analysis ===');
console.log('');

// Extract section 13 (Licensed Functions)
const section13Pattern = /13\.\s+LICENSED FUNCTIONS(.{0,300}?)14\./s;
const section13Match = fullText.match(section13Pattern);
if (section13Match) {
  console.log('Section 13 (Licensed Functions):');
  console.log('  Found: YES');
  console.log('  Content:', section13Match[1].trim().substring(0, 100) || '(empty)');
} else {
  console.log('Section 13 (Licensed Functions): NOT FOUND');
}

console.log('');

// Extract section 12 (Previous Address)
const section12Pattern = /12\.\s+PREVIOUS ADDRESS(.{0,300}?)13\./s;
const section12Match = fullText.match(section12Pattern);
if (section12Match) {
  console.log('Section 12 (Previous Address):');
  console.log('  Found: YES');
  console.log('  Has "Et ipsam":', section12Match[1].includes('Et ipsam'));
  console.log('  Content:', section12Match[1].trim().substring(0, 100));
} else {
  console.log('Section 12 (Previous Address): NOT FOUND');
}

console.log('');

// Extract section 15 (Regulatory History)
const section15Pattern = /15\.\s+REGULATORY HISTORY(.{0,300}?)Document Generated/s;
const section15Match = fullText.match(section15Pattern);
if (section15Match) {
  console.log('Section 15 (Regulatory History):');
  console.log('  Found: YES');
  console.log('  Has "SEC":', section15Match[1].includes('SEC'));
  console.log('  Content:', section15Match[1].trim().substring(0, 150));
} else {
  console.log('Section 15 (Regulatory History): NOT FOUND');
}
