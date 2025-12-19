const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Load DTO to check actual values
const dtoPath = path.join(__dirname, 'test-output', 'test-dto.json');
const dto = JSON.parse(fs.readFileSync(dtoPath, 'utf8'));

// Load generated DOCX
const docxPath = path.join(__dirname, 'test-output', 'test-18036be5-dadb-f011-8544-6045bd69d7d8.docx');
const content = fs.readFileSync(docxPath, 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip);
const fullText = doc.getFullText();

console.log('=== ACTION 2 VALIDATION: Boolean Rendering ===');
console.log('');

const booleanChecks = [
  {
    label: 'DIFC Disclosure',
    dtoPath: 'DIFCDisclosure.ConsentToDisclosure',
    dtoValue: dto.DIFCDisclosure.ConsentToDisclosure,
    searchPattern: /Do you consent to the disclosure.+?DIFCA\?\s*(\w+)/s
  },
  {
    label: 'Rep Office',
    dtoPath: 'Flags.RepOffice',
    dtoValue: dto.Flags.RepOffice,
    searchPattern: /Is the Candidate applying on behalf of a Representative Office\?\s*(\w+)/
  },
  {
    label: 'Previously Held',
    dtoPath: 'Flags.PreviouslyHeld',
    dtoValue: dto.Flags.PreviouslyHeld,
    searchPattern: /Has the candidate previously applied or held Authorised Individual status.+?DFSA\?\s*(\w+)/s
  },
  {
    label: 'Other Names',
    dtoPath: 'Flags.OtherNames',
    dtoValue: dto.Flags.OtherNames,
    searchPattern: /Has the candidate ever used other names or changed names\?\s*(\w+)/
  },
  {
    label: 'Has Start Date',
    dtoPath: 'Position.HasProposedStartDate',
    dtoValue: dto.Position.HasProposedStartDate,
    searchPattern: /Do you have proposed starting date\?\s*(\w+)/
  },
  {
    label: 'Regulatory History',
    dtoPath: 'Flags.HasRegulatoryHistory',
    dtoValue: dto.Flags.HasRegulatoryHistory,
    searchPattern: /Does the candidate hold or has previously held.+?Regulator\?\s*(\w+)/s
  },
  {
    label: 'Will be MLRO',
    dtoPath: 'Position.WillBeMLRO',
    dtoValue: dto.Position.WillBeMLRO,
    searchPattern: /Will the candidate applying for Principal Representative also be appointed as the MLRO\?\s*(\w+)/
  }
];

booleanChecks.forEach(check => {
  const match = fullText.match(check.searchPattern);
  const renderedValue = match ? match[1] : 'NOT FOUND';
  const expectedValue = check.dtoValue ? 'Yes' : 'No';
  const isCorrect = renderedValue === expectedValue;
  const status = isCorrect ? '✅' : '❌';

  console.log(status + ' ' + check.label);
  console.log('   DTO Value: ' + check.dtoValue);
  console.log('   Expected: ' + expectedValue);
  console.log('   Rendered: ' + renderedValue);
  console.log('');
});
