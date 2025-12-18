const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Load DTO
const dtoPath = path.join(__dirname, 'test-output', 'test-dto.json');
const dto = JSON.parse(fs.readFileSync(dtoPath, 'utf8'));

// Load generated DOCX
const docxPath = path.join(__dirname, 'test-output', 'conditional-test.docx');
const content = fs.readFileSync(docxPath, 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip);
const fullText = doc.getFullText();

console.log('=== COMPREHENSIVE CONDITIONAL FIELDS VALIDATION ===');
console.log('');
console.log('Testing all conditional fields from canonical guide...');
console.log('');

const conditionalFields = [
  {
    section: 'Rep Office Functions',
    conditionFlag: dto.Flags.RepOffice,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Please indicate the function(s)...',
    expectedValue: dto.Application.RepOfficeFunctions,
    searchText: 'Principal Representative'
  },
  {
    section: 'State Other Names',
    conditionFlag: dto.Flags.OtherNames,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'State other names',
    expectedValue: dto.Application.OtherNames?.StateOtherNames,
    searchText: 'Oren Watkins'
  },
  {
    section: 'Native Name (Other Names)',
    conditionFlag: dto.Flags.OtherNames,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Name in native language',
    expectedValue: dto.Application.OtherNames?.NativeName,
    searchText: 'Mannix Preston'
  },
  {
    section: 'Date Name Changed',
    conditionFlag: dto.Flags.OtherNames,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Date name changed',
    expectedValue: dto.Application.OtherNames?.DateChanged,
    searchText: '2025-12-25'
  },
  {
    section: 'Reason for Name Change',
    conditionFlag: dto.Flags.OtherNames,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Reason for change of name',
    expectedValue: dto.Application.OtherNames?.Reason,
    searchText: 'Ezekiel Gates'
  },
  {
    section: 'Previous Address - Address',
    conditionFlag: dto.Flags.ResidenceDurationLessThan3Years,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Previous Address',
    expectedValue: dto.Application.PreviousAddress?.Address,
    searchText: 'Et ipsam quo dolorem'
  },
  {
    section: 'Previous Address - Country',
    conditionFlag: dto.Flags.ResidenceDurationLessThan3Years,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Previous Country',
    expectedValue: dto.Application.PreviousAddress?.Country,
    searchText: 'Qatar'
  },
  {
    section: 'Proposed Start Date',
    conditionFlag: dto.Position.HasProposedStartDate,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Proposed starting date',
    expectedValue: dto.Position.ProposedStartDate,
    searchText: '2025-12-23'
  },
  {
    section: 'Regulatory History - Regulator',
    conditionFlag: dto.Flags.HasRegulatoryHistory,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Regulator',
    expectedValue: dto.RegulatoryHistory[0]?.Regulator,
    searchText: 'SEC (USA)'
  },
  {
    section: 'Regulatory History - Register Name',
    conditionFlag: dto.Flags.HasRegulatoryHistory,
    conditionValue: true,
    expectedBehavior: 'SHOW',
    field: 'Name of license register',
    expectedValue: dto.RegulatoryHistory[0]?.RegisterName,
    searchText: 'Test'
  }
];

let passCount = 0;
let failCount = 0;

conditionalFields.forEach((test, index) => {
  const conditionMet = test.conditionFlag === test.conditionValue;
  const shouldShow = conditionMet && test.expectedBehavior === 'SHOW';
  const isPresent = fullText.includes(test.searchText);

  const passed = shouldShow === isPresent;
  const status = passed ? '✅' : '❌';

  if (passed) passCount++;
  else failCount++;

  console.log(`${index + 1}. ${status} ${test.section}`);
  console.log(`   Condition: ${test.conditionFlag} === ${test.conditionValue} → ${conditionMet ? 'MET' : 'NOT MET'}`);
  console.log(`   Expected: ${shouldShow ? 'SHOW' : 'HIDE'}`);
  console.log(`   Actual: ${isPresent ? 'PRESENT' : 'ABSENT'}`);
  if (test.expectedValue) {
    console.log(`   Value: "${test.expectedValue}"`);
  }
  console.log('');
});

console.log('=== SUMMARY ===');
console.log(`✅ Passed: ${passCount}/${conditionalFields.length}`);
console.log(`❌ Failed: ${failCount}/${conditionalFields.length}`);
console.log('');

if (failCount === 0) {
  console.log('🎉 ALL CONDITIONAL FIELDS VALIDATED SUCCESSFULLY');
} else {
  console.log('⚠️  Some conditional fields need attention');
}
