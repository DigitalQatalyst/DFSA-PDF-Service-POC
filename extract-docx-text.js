const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Load the generated DOCX
const docxPath = path.join(__dirname, 'test-output', 'test-18036be5-dadb-f011-8544-6045bd69d7d8.docx');
const content = fs.readFileSync(docxPath, 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip);

// Extract text
const fullText = doc.getFullText();

// Check critical fields that were previously "undefined"
const checks = [
  { label: 'Firm Name', search: /Firm Name: (.+)Firm Number/},
  { label: 'Firm Number', search: /Firm Number: (.+)4\. REQUESTOR/},
  { label: 'Requestor Name', search: /Name of person making the submission: (.+)Position/},
  { label: 'Requestor Position', search: /Position \/ Title: (.+)Email address/},
  { label: 'Authorised Individual Name', search: /What is the name of proposed Authorised Individual\? (.+)6\./},
  { label: 'Contact Address', search: /11\. CANDIDATE ADDRESS AND CONTACT.+Address: (.+)Postcode \/ PO box/s},
  { label: 'Contact Mobile', search: /Mobile telephone number: (.+)Contact Email Address/},
  { label: 'Previous Address', search: /12\. PREVIOUS ADDRESS.+Address: (.+)Postcode/s},
  { label: 'Job Title', search: /What is the candidate's proposed job title\? (.+)Do you have/}
];

console.log('=== ACTION 1 VALIDATION: Template Data Binding ===');
console.log('');
console.log('Previously "undefined" fields now showing values:');
console.log('');

checks.forEach(check => {
  const match = fullText.match(check.search);
  const value = match ? match[1].trim().substring(0, 50) : 'NOT FOUND';
  const status = (value && value !== 'NOT FOUND' && value !== '') ? '✅' : '❌';
  console.log(status + ' ' + check.label + ': ' + value);
});

console.log('');
console.log('Checking for remaining "undefined" values...');
const undefinedCount = (fullText.match(/undefined/g) || []).length;
console.log('Occurrences of "undefined": ' + undefinedCount);
