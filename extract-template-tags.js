const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Load the template
const templatePath = path.join(__dirname, 'src', 'templates', 'AuthorisedIndividual', 'AuthorisedIndividual_v1.0.docx');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Extract document.xml which contains the template text
const documentXml = zip.files['word/document.xml'].asText();

// Find all template tags (pattern: {something})
const tagPattern = /\{([^}]+)\}/g;
const tags = [];
let match;

while ((match = tagPattern.exec(documentXml)) !== null) {
  tags.push(match[1]);
}

// Get unique tags
const uniqueTags = [...new Set(tags)];

console.log('=== TEMPLATE TAGS FOUND ===');
console.log('Total tags:', tags.length);
console.log('Unique tags:', uniqueTags.length);
console.log('');
console.log('All unique tags:');
uniqueTags.sort().forEach(tag => {
  console.log(`  {${tag}}`);
});
