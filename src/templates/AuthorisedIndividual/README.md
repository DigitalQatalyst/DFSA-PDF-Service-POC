# Authorised Individual DOCX Template

## Required File

**Filename**: `AuthorisedIndividual_v1.0.docx`

This template file must be created in Microsoft Word using the `docxtemplater` syntax.

## Template Syntax Guide

### Simple Fields
```
{Application.FirmName}
{Application.AuthorisedIndividualName}
{Position.ProposedJobTitle}
```

### Conditional Sections
```
{#Flags.OtherNames}
Previous Names: {Application.OtherNames.StateOtherNames}
Native Name: {Application.OtherNames.NativeName}
Date Changed: {Application.OtherNames.DateChanged}
Reason: {Application.OtherNames.Reason}
{/Flags.OtherNames}
```

### Repeating Sections (Tables)
```
{#PassportDetails}
Name: {FullName}
Date of Birth: {DateOfBirth}
Place of Birth: {PlaceOfBirth}
{/PassportDetails}
```

### Boolean Display
```
{#DIFCDisclosure.ConsentToDisclosure}Yes{/DIFCDisclosure.ConsentToDisclosure}{^DIFCDisclosure.ConsentToDisclosure}No{/DIFCDisclosure.ConsentToDisclosure}
```

## Available Data Structure

Based on canonical structure (71 fields):

```json
{
  "Guidelines": {
    "ConfirmRead": "string"
  },
  "DIFCDisclosure": {
    "ConsentToDisclosure": boolean
  },
  "Application": {
    "Id": "guid",
    "FirmName": "string",
    "FirmNumber": "string",
    "Requestor": {
      "Name": "string",
      "Position": "string",
      "Email": "string",
      "Phone": "string"
    },
    "AuthorisedIndividualName": "string",
    "Contact": {
      "Address": "string",
      "PostCode": "string",
      "Country": "string",
      "Mobile": "string",
      "Email": "string",
      "ResidenceDuration": "string"
    },
    "PreviousAddress": {  // CONDITIONAL: null if Flags.ResidenceDurationLessThan3Years = false
      "Address": "string",
      "PostCode": "string",
      "Country": "string"
    },
    "OtherNames": {  // CONDITIONAL: null if Flags.OtherNames = false
      "StateOtherNames": "string",
      "NativeName": "string",
      "DateChanged": "YYYY-MM-DD",
      "Reason": "string"
    }
  },
  "Flags": {
    "RepOffice": boolean,
    "PreviouslyHeld": boolean,
    "OtherNames": boolean,
    "ResidenceDurationLessThan3Years": boolean,
    "HasStartDate": boolean,
    "HasRegulatoryHistory": boolean,
    "LicensedFunctionSelected": boolean
  },
  "LicensedFunctions": {
    "ShowLicensedFunctionsSection": boolean,
    "ShowMandatoryFunctionsQuestion": boolean,
    "LicensedFunctionChoice": "LicensedDirector|LicensedPartner|SeniorManager|ResponsibleOfficer",
    "LicensedFunctionChoiceLabel": "Licensed Director|Licensed Partner|Senior Manager|Responsible Officer",
    "SeniorExecutiveOfficer": boolean,
    "FinanceOfficer": boolean,
    "ComplianceOfficer": boolean,
    "MLRO": boolean,
    "NoMandatoryFunction": boolean,
    "ShowResponsibleOfficerConfirmations": boolean,
    "RespResp1": "string",
    "RespResp2": "string",
    "RespResp3": "string",
    "ExecutiveType": "string"
  },
  "PassportDetails": [  // REPEATING
    {
      "Title": "string",
      "FullName": "string",
      "DateOfBirth": "YYYY-MM-DD",
      "PlaceOfBirth": "string",
      "UaeResident": boolean,
      "NumberOfCitizenships": "string",
      "OtherNames": "string",
      "NativeName": "string"
    }
  ],
  "Citizenships": [  // REPEATING
    {
      "Country": "string",
      "PassportNo": "string",
      "ExpiryDate": "YYYY-MM-DD"
    }
  ],
  "RegulatoryHistory": [  // REPEATING (CONDITIONAL: empty if Flags.HasRegulatoryHistory = false)
    {
      "Regulator": "string",
      "DateStarted": "YYYY-MM-DD",
      "DateFinished": "YYYY-MM-DD",
      "LicenseName": "string",
      "RegisterName": "string",
      "Overview": "string",
      "IsOtherRegulator": boolean,
      "OtherRegulatorDetails": "string|null"
    }
  ],
  "Position": {
    "ProposedJobTitle": "string",
    "HasProposedStartDate": boolean,
    "ProposedStartDate": "YYYY-MM-DD|null",
    "StartDateExplanation": "string|null",
    "WillBeMLRO": boolean
  },
  "GeneratedAt": "ISO timestamp",
  "TemplateVersion": "1.0"
}
```

## Conditional Flags Guide

| Flag | Purpose | Impact |
|------|---------|--------|
| `RepOffice` | Representative Office application | Hides Licensed Functions section |
| `OtherNames` | Has used other names | Shows Other Names subsection |
| `ResidenceDurationLessThan3Years` | Residence < 3 years | Shows Previous Address section |
| `HasRegulatoryHistory` | Has regulatory licenses | Shows Regulatory History table |
| `HasStartDate` | Has proposed start date | Shows date field vs explanation |
| `LicensedFunctionSelected` | Selected a licensed function | Enables function-specific fields |

## Example Template Structure

```
DFSA Authorised Individual Application

Firm Details:
- Firm Name: {Application.FirmName}
- Firm Number: {Application.FirmNumber}

Candidate Information:
- Name: {Application.AuthorisedIndividualName}
- Address: {Application.Contact.Address}, {Application.Contact.Country}

{#Application.PreviousAddress}
Previous Address:
- {PreviousAddress.Address}, {PreviousAddress.Country}
{/Application.PreviousAddress}

{#Application.OtherNames}
Other Names Used:
- Previous: {OtherNames.StateOtherNames}
- Native: {OtherNames.NativeName}
- Changed: {OtherNames.DateChanged} ({OtherNames.Reason})
{/Application.OtherNames}

Passport Details:
{#PassportDetails}
- {FullName}, DOB: {DateOfBirth}, Born: {PlaceOfBirth}
{/PassportDetails}

Citizenships:
{#Citizenships}
- {Country}: Passport {PassportNo} (Expires: {ExpiryDate})
{/Citizenships}

{#LicensedFunctions.ShowLicensedFunctionsSection}
Licensed Function: {LicensedFunctions.LicensedFunctionChoiceLabel}
{/LicensedFunctions.ShowLicensedFunctionsSection}

{#RegulatoryHistory}
Regulatory History:
{#.}
- {Regulator}: {LicenseName} ({DateStarted} - {DateFinished})
{/.}
{/RegulatoryHistory}

Position:
- Job Title: {Position.ProposedJobTitle}
{#Position.HasProposedStartDate}
- Start Date: {Position.ProposedStartDate}
{/Position.HasProposedStartDate}
{^Position.HasProposedStartDate}
- Start Date Explanation: {Position.StartDateExplanation}
{/Position.HasProposedStartDate}
```

## Creating the Template

1. Open Microsoft Word
2. Create new document with DFSA branding/layout
3. Insert placeholders using `{FieldName}` syntax
4. Save as `AuthorisedIndividual_v1.0.docx` in this directory
5. Test with: `npm run test:template`

## Validation

After creating the template, run:

```bash
npm run test:template
```

This will:
- Verify template file exists
- Check for syntax errors
- Test rendering with sample data
- Validate all placeholders map to DTO fields

## Notes

- Use `paragraphLoop: true` mode for repeating sections in tables
- Use `linebreaks: true` to support `\n` in text fields
- Conditional sections automatically hide if flag is false or data is null
- Empty arrays in repeating sections result in empty output (no error)
