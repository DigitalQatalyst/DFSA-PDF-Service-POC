const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');
const angularParser = require('angular-expressions');

// Test data matching DTO structure
const testData = {
  Guidelines: {
    ConfirmRead: "356960001"
  },
  Application: {
    FirmName: "Gold and Silver Bros",
    FirmNumber: "F011050",
    Requestor: {
      Name: "John Doe",
      Position: "Sr, Professional Advisor"
    }
  }
};

console.log('Test Data:');
console.log(JSON.stringify(testData, null, 2));
console.log('');

// Load template
const templatePath = path.join(__dirname, 'src', 'templates', 'AuthorisedIndividual', 'AuthorisedIndividual_v1.0.docx');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Configure angular parser for nested property access
const expressionParser = (tag) => {
  return {
    get: (scope, context) => {
      const result = angularParser.compile(tag)(scope);
      return result === undefined ? '' : result;
    }
  };
};

// Create docxtemplater instance with angular parser
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  parser: expressionParser
});

// Set data
doc.render(testData);

// Check for errors
const fullText = doc.getFullText();
const errors = fullText.match(/undefined/g);
console.log('Rendering complete');
console.log('Contains "undefined":', errors ? 'YES (' + errors.length + ' occurrences)' : 'NO');
console.log('');

// Extract a sample of rendered text
const lines = fullText.split('\n').slice(0, 30);
console.log('First 30 lines of output:');
lines.forEach((line, i) => {
  const trimmed = line.trim();
  if (trimmed) console.log((i+1) + ': ' + trimmed);
});
