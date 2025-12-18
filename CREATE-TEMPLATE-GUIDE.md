# DOCX Template Creation Guide

## Quick Start

**Goal:** Create `AuthorisedIndividual_v1.0.docx` template file for PDF generation.

**Location:** `src/templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx`

**Time Required:** 30-60 minutes (depending on formatting complexity)

---

## Prerequisites

1. **Microsoft Word** (2016 or later recommended)
2. **Understanding of docxtemplater syntax** (simple - see examples below)
3. **Access to canonical structure reference** (your colleague's master table)

---

## Step-by-Step Instructions

### Step 1: Create Template Directory Structure

```bash
# Navigate to project root
cd dfsa-pdf-service-poc

# Create template directory (if it doesn't exist)
mkdir -p src/templates/AuthorisedIndividual
```

### Step 2: Open Microsoft Word

1. Open Microsoft Word
2. Create a new blank document
3. Save it as: `AuthorisedIndividual_v1.0.docx`
4. Save location: `src/templates/AuthorisedIndividual/`

### Step 3: Structure the Document

Create sections matching the **canonical structure** (15 sections):

#### Document Structure:

```
1. Application Guidelines (AUTH_GUIDE)
2. DIFC Disclosure (AUTH_DIFC_DISCLOSURE)
3. Firm Information (AUTH_FIRM_INFO)
4. Requestor Information (AUTH_REQUESTOR_INFO)
5. Authorised Individual Information (AUTH_INDIVIDUAL_INFO)
6. Applicant Information (AUTH_INFO)
7. Candidate Identity (AUTH_IDENTITY)
8. Candidate Passport Details (AUTH_PASSPORT) - REPEATING
9. Candidate Other Names (AUTH_OTHER_NAMES) - CONDITIONAL
10. Candidate Citizenship (AUTH_CITIZEN) - REPEATING
11. Candidate Address and Contact (AUTH_CONTACT)
12. Previous Address (AUTH_PREV_ADDRESS) - CONDITIONAL
13. Licensed Functions (AUTH_LIC_FUNC) - CONDITIONAL
14. Candidate Position (AUTH_POSITION)
15. Regulatory History (AUTH_REG_HISTORY) - CONDITIONAL, REPEATING
```

---

## Template Syntax Reference

### Basic Placeholder Syntax

**Simple Field:**
```
{Application.FirmName}
{Application.AuthorisedIndividualName}
```

**Nested Field:**
```
{Application.Requestor.Name}
{Application.Requestor.Email}
{Application.Contact.Address}
```

**Boolean Display:**
```
{#Flags.RepOffice}Yes{/Flags.RepOffice}{^Flags.RepOffice}No{/Flags.RepOffice}
```

**Conditional Section:**
```
{#Flags.OtherNames}
Previous Names: {Application.OtherNames.StateOtherNames}
Date Changed: {Application.OtherNames.DateChanged}
Reason: {Application.OtherNames.Reason}
{/Flags.OtherNames}
```

**Repeating Section (Table):**
```
{#PassportDetails}
Title: {Title}
Full Name: {FullName}
Date of Birth: {DateOfBirth}
Place of Birth: {PlaceOfBirth}
---
{/PassportDetails}
```

---

## Complete Template Example

Here's a complete example structure you can copy into Word:

```
AUTHORISED INDIVIDUAL APPLICATION

1. APPLICATION GUIDELINES
I confirm that I have carefully read and understood the guidelines: {Application.Guidelines.Confirmation}

2. DIFC DISCLOSURE
Do you consent to disclosure of information to DIFCA? {#DIFCDisclosure.ConsentToDisclosure}Yes{/DIFCDisclosure.ConsentToDisclosure}{^DIFCDisclosure.ConsentToDisclosure}No{/DIFCDisclosure.ConsentToDisclosure}

3. FIRM INFORMATION
Firm Name: {Application.FirmName}
Firm Number: {Application.FirmNumber}

4. REQUESTOR INFORMATION
Name: {Application.Requestor.Name}
Position: {Application.Requestor.Position}
Email: {Application.Requestor.Email}
Phone: {Application.Requestor.Phone}

5. AUTHORISED INDIVIDUAL INFORMATION
Name: {Application.AuthorisedIndividualName}

6. APPLICANT INFORMATION
Is the candidate applying on behalf of a Representative Office? {#Flags.RepOffice}Yes{/Flags.RepOffice}{^Flags.RepOffice}No{/Flags.RepOffice}

{#Flags.RepOffice}
Please indicate the function(s): {Application.RepOfficeFunctions}
{/Flags.RepOffice}

7. CANDIDATE IDENTITY
Has the candidate previously held Authorised Individual status? {#Flags.PreviouslyHeld}Yes{/Flags.PreviouslyHeld}{^Flags.PreviouslyHeld}No{/Flags.PreviouslyHeld}

8. CANDIDATE PASSPORT DETAILS
{#PassportDetails}
Title: {Title}
Full Name: {FullName}
Date of Birth: {DateOfBirth}
Place of Birth: {PlaceOfBirth}
UAE Resident: {#UaeResident}Yes{/UaeResident}{^UaeResident}No{/UaeResident}
Number of Citizenships: {NumberOfCitizenships}
Other Names: {OtherNames}
Name in Native Language: {NativeName}
---
{/PassportDetails}

9. CANDIDATE OTHER NAMES
{#Flags.OtherNames}
Has the candidate ever used other names? Yes
State other names: {Application.OtherNames.StateOtherNames}
Name in native language: {Application.OtherNames.NativeName}
Date name changed: {Application.OtherNames.DateChanged}
Reason for change: {Application.OtherNames.Reason}
{/Flags.OtherNames}

10. CANDIDATE CITIZENSHIP
{#Citizenships}
Country/Territory: {Country}
Passport No.: {PassportNo}
Expiry Date: {ExpiryDate}
---
{/Citizenships}

11. CANDIDATE ADDRESS AND CONTACT
Address: {Application.Contact.Address}
Postcode/PO Box: {Application.Contact.PostCode}
Country: {Application.Contact.Country}
Mobile: {Application.Contact.Mobile}
Email: {Application.Contact.Email}

12. PREVIOUS ADDRESS
{#Flags.ResidenceDurationLessThan3Years}
Address: {Application.PreviousAddress.Address}
Postcode/PO Box: {Application.PreviousAddress.PostCode}
Country: {Application.PreviousAddress.Country}
{/Flags.ResidenceDurationLessThan3Years}

13. LICENSED FUNCTIONS
{#LicensedFunctions.ShowLicensedFunctionsSection}
Please select the Licensed Function: {LicensedFunctions.LicensedFunctionChoiceLabel}

{#LicensedFunctions.ShowMandatoryFunctionsQuestion}
Senior Executive Officer: {#LicensedFunctions.SeniorExecutiveOfficer}Yes{/LicensedFunctions.SeniorExecutiveOfficer}{^LicensedFunctions.SeniorExecutiveOfficer}No{/LicensedFunctions.SeniorExecutiveOfficer}
Finance Officer: {#LicensedFunctions.FinanceOfficer}Yes{/LicensedFunctions.FinanceOfficer}{^LicensedFunctions.FinanceOfficer}No{/LicensedFunctions.FinanceOfficer}
Compliance Officer: {#LicensedFunctions.ComplianceOfficer}Yes{/LicensedFunctions.ComplianceOfficer}{^LicensedFunctions.ComplianceOfficer}No{/LicensedFunctions.ComplianceOfficer}
Money Laundering Reporting Officer: {#LicensedFunctions.MLRO}Yes{/LicensedFunctions.MLRO}{^LicensedFunctions.MLRO}No{/LicensedFunctions.MLRO}
{/LicensedFunctions.ShowMandatoryFunctionsQuestion}

{#LicensedFunctions.ShowResponsibleOfficerConfirmations}
The applicant has significant responsibility: {LicensedFunctions.RespResp1}
The applicant exercises significant influence: {LicensedFunctions.RespResp2}
The applicant is not an employee: {LicensedFunctions.RespResp3}
{/LicensedFunctions.ShowResponsibleOfficerConfirmations}
{/LicensedFunctions.ShowLicensedFunctionsSection}

14. CANDIDATE POSITION
Job Title: {Position.ProposedJobTitle}
Has proposed starting date? {#Flags.HasStartDate}Yes{/Flags.HasStartDate}{^Flags.HasStartDate}No{/Flags.HasStartDate}

{#Flags.HasStartDate}
Proposed Starting Date: {Position.ProposedStartingDate}
{/Flags.HasStartDate}

{^Flags.HasStartDate}
Please explain: {Position.Explanation}
{/Flags.HasStartDate}

15. REGULATORY HISTORY
{#Flags.HasRegulatoryHistory}
Has regulatory licenses? Yes

{#RegulatoryHistory}
Regulator: {Regulator}
Date Started: {DateStarted}
Date Finished: {DateFinished}
License Name: {LicenseName}
Register Name: {RegisterName}
Overview: {Overview}
{#IsOtherRegulator}
Other Regulator Details: {OtherRegulatorDetails}
{/IsOtherRegulator}
---
{/RegulatoryHistory}
{/Flags.HasRegulatoryHistory}
```

---

## Key Points to Remember

### 1. Placeholder Names Must Match Exactly

The placeholder names must match the JSON structure from the mapper. Check `test-output/test-dto.json` after running `npm run test:pdf` to see the exact structure.

### 2. Conditional Sections

- Use `{#FlagName}...{/FlagName}` for conditional sections
- Use `{^FlagName}...{/FlagName}` for "else" (when flag is false)
- Flags are in the `Flags` object: `{#Flags.OtherNames}`

### 3. Repeating Sections

- Use `{#ArrayName}...{/ArrayName}` for repeating sections
- Inside the block, use field names from the array items
- Examples: `{#PassportDetails}`, `{#Citizenships}`, `{#RegulatoryHistory}`

### 4. Boolean Values

- Use `{#BooleanField}Yes{/BooleanField}{^BooleanField}No{/BooleanField}` pattern
- Or just: `{#BooleanField}Yes{/BooleanField}` if you only show when true

### 5. Empty Values

- If a field is null/empty, docxtemplater will leave it blank
- Consider adding labels like "N/A" or "Not provided" if needed

---

## Validation Steps

After creating the template:

1. **Save the file** as `AuthorisedIndividual_v1.0.docx` in `src/templates/AuthorisedIndividual/`

2. **Run validation:**
   ```bash
   npm run test:pdf
   ```

3. **Check the output:**
   - If template is found, it will attempt to render
   - Check `test-output/` folder for generated files
   - Review any error messages about missing placeholders

4. **Test with sample data:**
   - The test uses real Dataverse data
   - Check `test-output/test-dto.json` to see what data is available
   - Adjust template placeholders to match

---

## Common Issues & Solutions

### Issue: "Template not found"
**Solution:** Ensure file is saved as `AuthorisedIndividual_v1.0.docx` (exact name) in `src/templates/AuthorisedIndividual/`

### Issue: "Unclosed tag" error
**Solution:** Every `{#Tag}` must have a matching `{/Tag}`. Check all conditional blocks are properly closed.

### Issue: Placeholder shows as `{Field.Name}` in output
**Solution:** Check spelling - placeholder names are case-sensitive and must match JSON structure exactly.

### Issue: Conditional section always shows
**Solution:** Check flag name matches exactly: `{#Flags.OtherNames}` not `{#Flags.OtherName}`

---

## Template Structure Reference

Based on your canonical model, here are the exact field paths:

### Application Object
- `Application.FirmName`
- `Application.FirmNumber`
- `Application.Requestor.Name`
- `Application.Requestor.Position`
- `Application.Requestor.Email`
- `Application.Requestor.Phone`
- `Application.AuthorisedIndividualName`
- `Application.Contact.Address`
- `Application.Contact.PostCode`
- `Application.Contact.Country`
- `Application.Contact.Mobile`
- `Application.Contact.Email`
- `Application.PreviousAddress.Address` (conditional)
- `Application.PreviousAddress.PostCode` (conditional)
- `Application.PreviousAddress.Country` (conditional)
- `Application.OtherNames.StateOtherNames` (conditional)
- `Application.OtherNames.NativeName` (conditional)
- `Application.OtherNames.DateChanged` (conditional)
- `Application.OtherNames.Reason` (conditional)

### Flags Object
- `Flags.RepOffice`
- `Flags.PreviouslyHeld`
- `Flags.OtherNames`
- `Flags.ResidenceDurationLessThan3Years`
- `Flags.HasStartDate`
- `Flags.HasRegulatoryHistory`
- `Flags.LicensedFunctionSelected`

### LicensedFunctions Object
- `LicensedFunctions.ShowLicensedFunctionsSection`
- `LicensedFunctions.LicensedFunctionChoiceLabel`
- `LicensedFunctions.SeniorExecutiveOfficer`
- `LicensedFunctions.FinanceOfficer`
- `LicensedFunctions.ComplianceOfficer`
- `LicensedFunctions.MLRO`
- `LicensedFunctions.ShowResponsibleOfficerConfirmations`
- `LicensedFunctions.RespResp1`
- `LicensedFunctions.RespResp2`
- `LicensedFunctions.RespResp3`

### Repeating Arrays
- `PassportDetails[]` - fields: Title, FullName, DateOfBirth, PlaceOfBirth, UaeResident, NumberOfCitizenships, OtherNames, NativeName
- `Citizenships[]` - fields: Country, PassportNo, ExpiryDate
- `RegulatoryHistory[]` - fields: Regulator, DateStarted, DateFinished, LicenseName, RegisterName, Overview, IsOtherRegulator, OtherRegulatorDetails

---

## Quick Checklist

- [ ] Created `src/templates/AuthorisedIndividual/` directory
- [ ] Created `AuthorisedIndividual_v1.0.docx` in Microsoft Word
- [ ] Added all 15 sections from canonical structure
- [ ] Used correct placeholder syntax (`{Field.Name}`)
- [ ] Added conditional blocks for conditional sections
- [ ] Added repeating blocks for arrays
- [ ] Saved file in correct location
- [ ] Ran `npm run test:pdf` to validate
- [ ] Checked `test-output/test-dto.json` to verify field names match
- [ ] Template renders without errors

---

## Next Steps After Template Creation

1. **Test template rendering:**
   ```bash
   npm run test:pdf
   ```

2. **Review generated DOCX:**
   - Check `test-output/` folder
   - Open generated DOCX in Word
   - Verify all placeholders are replaced
   - Verify conditional sections appear/disappear correctly

3. **Adjust formatting:**
   - Add page breaks where needed
   - Format tables for repeating sections
   - Add headers/footers if required
   - Adjust fonts and spacing

4. **Test with different data scenarios:**
   - Test with records that have all conditional sections
   - Test with records that have repeating data
   - Verify empty/null values display correctly

---

## Need Help?

- Check `test-output/test-dto.json` for exact JSON structure
- Review `src/mappers/authorisedIndividualMapper.ts` for field mappings
- See docxtemplater documentation: https://docxtemplater.com/
- Run `npm run test:pdf` to see detailed error messages

