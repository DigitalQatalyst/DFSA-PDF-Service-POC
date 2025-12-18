const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Load template
const templatePath = path.join(__dirname, 'src', 'templates', 'AuthorisedIndividual', 'AuthorisedIndividual_v1.0.docx');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Extract document.xml
const documentXml = zip.files['word/document.xml'].asText();

// Find DIFC Disclosure section (example boolean field)
const difcMatch = documentXml.match(/Do you consent to the disclosure.{0,500}\{[^}]+DIFCDisclosure[^}]+\}.{0,200}/);
if (difcMatch) {
  console.log('DIFC Disclosure section (template XML):');
  console.log(difcMatch[0].substring(0, 500));
  console.log('...');
}

// Find pattern for "Yes/No" rendering
const yesNoPattern = /\{[#^][^}]+\}[^{]*?(Yes|No)[^{]*?\{\/[^}]+\}/g;
let match;
let count = 0;
console.log('');
console.log('Yes/No patterns found:');
while ((match = yesNoPattern.exec(documentXml)) !== null && count < 5) {
  console.log('---');
  console.log(match[0]);
  count++;
}
