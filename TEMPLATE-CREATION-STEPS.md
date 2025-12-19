# DOCX Template Creation - Step by Step

## What You Need

1. **Microsoft Word** (any recent version)
2. **5-10 minutes** to create the basic template
3. **The template text file** (`TEMPLATE-START-HERE.txt`) - already created for you!

---

## Quick Steps (5 minutes)

### Step 1: Open the Template Text File

1. Navigate to: `src/templates/AuthorisedIndividual/TEMPLATE-START-HERE.txt`
2. Open it in Notepad or any text editor
3. **Copy ALL the content** (Ctrl+A, Ctrl+C)

### Step 2: Create Word Document

1. Open **Microsoft Word**
2. Create a **new blank document**
3. **Paste** the copied content (Ctrl+V)

### Step 3: Format (Optional but Recommended)

1. Add **headers/footers** if needed
2. Format **section headings** (make them bold/larger)
3. Add **page breaks** between major sections if desired
4. Format **tables** for repeating sections (Passport Details, Citizenships, Regulatory History)

### Step 4: Save the File

1. Click **File → Save As**
2. Navigate to: `src/templates/AuthorisedIndividual/`
3. **File name:** `AuthorisedIndividual_v1.0.docx` (EXACT name, case-sensitive)
4. **File type:** Word Document (*.docx)
5. Click **Save**

### Step 5: Verify

Run the test:
```bash
npm run test:pdf
```

Expected output:
- ✅ Template found
- ✅ Template renders successfully
- ✅ Check `test-output/` folder for generated DOCX

---

## Important Notes

### ⚠️ Critical Requirements

1. **File Name Must Be Exact:**
   - ✅ `AuthorisedIndividual_v1.0.docx`
   - ❌ `AuthorisedIndividual_v1.docx` (missing .0)
   - ❌ `authorisedindividual_v1.0.docx` (wrong case)
   - ❌ `AuthorisedIndividual_v1.0.doc` (wrong format)

2. **File Location Must Be Exact:**
   - ✅ `src/templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx`
   - ❌ `src/templates/AuthorisedIndividual_v1.0.docx` (wrong folder)
   - ❌ `templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx` (missing src/)

3. **Placeholder Syntax:**
   - ✅ `{Application.FirmName}` (correct)
   - ❌ `{Application.Firmname}` (wrong case)
   - ❌ `{Application.Firm Name}` (spaces not allowed)
   - ❌ `{{Application.FirmName}}` (double braces)

4. **Conditional Blocks:**
   - ✅ `{#Flags.OtherNames}...{/Flags.OtherNames}` (correct)
   - ❌ `{#Flags.OtherNames}...{#/Flags.OtherNames}` (wrong closing tag)
   - ❌ `{#Flags.OtherNames}...` (missing closing tag)

---

## What the Placeholders Mean

### Simple Fields
- `{Application.FirmName}` → Shows the firm name from Dataverse
- `{Application.AuthorisedIndividualName}` → Shows candidate name

### Conditional Sections
- `{#Flags.OtherNames}...{/Flags.OtherNames}` → Only shows if candidate has used other names
- `{#Flags.RepOffice}...{/Flags.RepOffice}` → Only shows if applying for Representative Office

### Repeating Sections
- `{#PassportDetails}...{/PassportDetails}` → Repeats for each passport record
- `{#Citizenships}...{/Citizenships}` → Repeats for each citizenship record

### Boolean Display
- `{#Flags.RepOffice}Yes{/Flags.RepOffice}{^Flags.RepOffice}No{/Flags.RepOffice}`
  - Shows "Yes" if true, "No" if false

---

## Testing Your Template

### Test 1: Basic Validation
```bash
npm run test:template
```
Checks if template file exists and is valid.

### Test 2: Full Pipeline Test
```bash
npm run test:pdf
```
1. Fetches real data from Dataverse
2. Maps to DTO structure
3. Renders template with data
4. Generates DOCX file

**Check output:**
- Look in `test-output/` folder
- Open the generated DOCX file
- Verify all placeholders are replaced
- Verify conditional sections appear/disappear correctly

---

## Troubleshooting

### "Template not found"
- ✅ Check file name is exactly `AuthorisedIndividual_v1.0.docx`
- ✅ Check file is in `src/templates/AuthorisedIndividual/` folder
- ✅ Check file extension is `.docx` not `.doc`

### "Unclosed tag" error
- ✅ Every `{#Tag}` must have matching `{/Tag}`
- ✅ Check all conditional blocks are closed
- ✅ Check repeating sections are closed

### Placeholder shows as `{Field.Name}` in output
- ✅ Check spelling matches exactly (case-sensitive)
- ✅ Check field path matches JSON structure
- ✅ Run `npm run test:pdf` and check `test-output/test-dto.json` for exact field names

### Conditional section always shows
- ✅ Check flag name: `{#Flags.OtherNames}` not `{#Flags.OtherName}`
- ✅ Verify flag is in the `Flags` object in JSON

---

## Next Steps After Template Creation

1. ✅ **Test template:** `npm run test:pdf`
2. ✅ **Review generated DOCX** in `test-output/` folder
3. ✅ **Adjust formatting** in Word (fonts, spacing, tables)
4. ✅ **Test with different records** that have conditional sections populated
5. ✅ **Proceed to PDF conversion** (Step 1.2)

---

## Quick Reference

**Template File:** `src/templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx`

**Test Command:** `npm run test:pdf`

**Check DTO Structure:** `test-output/test-dto.json`

**Full Guide:** `CREATE-TEMPLATE-GUIDE.md`

