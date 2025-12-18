const { generateDocx } = require('./dist/services/templating/docxService');
const fs = require('fs');
const path = require('path');

async function test() {
  // Load DTO
  const dtoPath = path.join(__dirname, 'test-output', 'test-dto.json');
  const dto = JSON.parse(fs.readFileSync(dtoPath, 'utf8'));

  console.log('Generating DOCX with current DTO...');
  console.log('');
  console.log('Conditional flags:');
  console.log('  RepOffice:', dto.Flags.RepOffice, '→ Licensed Functions should be HIDDEN');
  console.log('  OtherNames:', dto.Flags.OtherNames, '→ Other Names fields should be VISIBLE');
  console.log('  ResidenceDuration<3yrs:', dto.Flags.ResidenceDurationLessThan3Years, '→ Previous Address should be VISIBLE');
  console.log('  HasRegulatoryHistory:', dto.Flags.HasRegulatoryHistory, '→ Regulatory History should be VISIBLE');
  console.log('');

  const docxBuffer = await generateDocx({
    documentType: 'AuthorisedIndividual',
    templateVersion: '1.0',
    data: dto
  });

  const outputPath = path.join(__dirname, 'test-output', 'conditional-test.docx');
  fs.writeFileSync(outputPath, docxBuffer);

  console.log('✅ Generated:', outputPath);
  console.log('Size:', docxBuffer.length, 'bytes');

  // Extract and check content
  const PizZip = require('pizzip');
  const Docxtemplater = require('docxtemplater');

  const zip = new PizZip(docxBuffer);
  const doc = new Docxtemplater(zip);
  const fullText = doc.getFullText();

  console.log('');
  console.log('Content checks:');
  console.log('  Previous Address section has content:', fullText.includes('Et ipsam quo dolorem'));
  console.log('  Other Names "Oren Watkins" present:', fullText.includes('Oren Watkins'));
  console.log('  Regulatory History "SEC (USA)" present:', fullText.includes('SEC (USA)'));
  console.log('  Licensed Functions section present:', fullText.includes('LICENSED FUNCTIONS'));
}

test().catch(console.error);
