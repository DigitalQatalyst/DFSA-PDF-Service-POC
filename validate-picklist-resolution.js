const fs = require('fs');
const path = require('path');

// Load DTO
const dtoPath = path.join(__dirname, 'test-output', 'test-dto.json');
const dto = JSON.parse(fs.readFileSync(dtoPath, 'utf8'));

console.log('=== ACTION 3 VALIDATION: Picklist Resolution ===');
console.log('');

const picklistChecks = [
  {
    label: 'Guidelines Confirm',
    path: 'Guidelines.ConfirmRead',
    value: dto.Guidelines.ConfirmRead,
    before: '356960001',
    expectedAfter: 'I confirm'
  },
  {
    label: 'Passport Title',
    path: 'PassportDetails[0].Title',
    value: dto.PassportDetails[0].Title,
    before: '356960005',
    expectedAfter: 'Other'
  },
  {
    label: 'Number of Citizenships',
    path: 'PassportDetails[0].NumberOfCitizenships',
    value: dto.PassportDetails[0].NumberOfCitizenships,
    before: '356960004',
    expectedAfter: '5'
  },
  {
    label: 'Citizenship Country',
    path: 'Citizenships[0].Country',
    value: dto.Citizenships[0].Country,
    before: '356960241',
    expectedAfter: 'United Arab Emirates'
  },
  {
    label: 'Contact Country',
    path: 'Application.Contact.Country',
    value: dto.Application.Contact.Country,
    before: '356960241',
    expectedAfter: 'United Arab Emirates'
  },
  {
    label: 'Previous Address Country',
    path: 'Application.PreviousAddress.Country',
    value: dto.Application.PreviousAddress.Country,
    before: '356960173',
    expectedAfter: 'Qatar'
  },
  {
    label: 'Regulator',
    path: 'RegulatoryHistory[0].Regulator',
    value: dto.RegulatoryHistory[0].Regulator,
    before: '356960004',
    expectedAfter: 'SEC (USA)'
  }
];

console.log('Before vs After:');
console.log('');

picklistChecks.forEach(check => {
  const isResolved = check.value === check.expectedAfter;
  const status = isResolved ? '✅' : '❌';

  console.log(status + ' ' + check.label);
  console.log('   Before: ' + check.before + ' (raw numeric)');
  console.log('   After:  ' + check.value);
  console.log('   Expected: ' + check.expectedAfter);
  console.log('');
});

const allResolved = picklistChecks.every(check => check.value === check.expectedAfter);
console.log('');
console.log('=== RESULT ===');
console.log(allResolved ? '✅ All picklist values resolved correctly' : '❌ Some values not resolved');
