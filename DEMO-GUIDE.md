# DFSA PDF Service - Demo Guide

## Current Configuration Status

### ✅ Configured (Ready to Demo)
- `AZURE_TENANT_ID` = `dqdfsab2c`
- `AZURE_CLIENT_ID` = `27c13640-86a9-4e1f-8f3f-5e631b8ba3b6`
- `DATAVERSE_URL` = `https://dfsaprimarydev.crm15.dynamics.com/`
- `POWER_PAGES_URL` = `https://dqdfsadev3.powerappsportals.com/`
- `ALLOWED_ORIGINS` = Configured for localhost and Power Pages

### ⚠️ Pending Configuration
- `AZURE_CLIENT_SECRET` = **NOT SET** (still shows placeholder)

**Impact**: Without the client secret, the service **CANNOT**:
- ❌ Authenticate with Dataverse
- ❌ Fetch any records
- ❌ Generate PDFs

---

## Configuration Validation Approach

### Step 1: Validate Environment Variables

Run this validation script to check configuration:

```bash
# Create validation script
npm run validate:config
```

**What it checks**:
1. ✅ All required variables are set (not placeholder values)
2. ✅ DATAVERSE_URL is accessible
3. ✅ Azure AD credentials are valid
4. ✅ Can obtain access token
5. ⚠️ Optional: Template file exists
6. ⚠️ Optional: PDF conversion configured
7. ⚠️ Optional: Blob storage configured

### Step 2: Test Connection to Dataverse

```bash
npm run test:dataverse
```

**Expected Outcome**:
- ✅ **SUCCESS**: Token acquired, records fetched
- ❌ **FAILURE**: "Failed to obtain Dataverse access token" → Client secret incorrect

### Step 3: Test Canonical Mapping

```bash
npm run test:mapper
```

**Expected Outcome**:
- ✅ **SUCCESS**: Shows all 8 condition flags and section visibility
- ❌ **FAILURE**: No records found or mapping errors

### Step 4: Start Server

```bash
npm run dev
```

**Expected Outcome**:
```
============================================================
DFSA PDF Service POC Started
============================================================
Environment: development
Port: 3001
Dataverse URL: https://dfsaprimarydev.crm15.dynamics.com/
Allowed Origins: http://localhost:3000, https://dqdfsadev3.powerappsportals.com/
============================================================
API Endpoints:
  [POC - Demonstration]
    GET  http://localhost:3001/health
    GET  http://localhost:3001/api/v1/authorised-individual/list
    GET  http://localhost:3001/api/v1/authorised-individual/:id
    GET  http://localhost:3001/api/v1/authorised-individual/:id/conditional-demo
  [PDF Generation]
    POST http://localhost:3001/api/pdf/generate
    GET  http://localhost:3001/api/pdf/validate-template/:documentType/:version
============================================================
```

---

## Demo Scenarios

### Scenario A: Without Client Secret (Current State)

**What You CAN Demo**:
1. ✅ **Architecture Overview**
   - Show unified service structure
   - Explain POC + Production pipeline
   - Walk through code organization

2. ✅ **Security Hardening Improvements**
   - Compare KF vs DFSA implementations
   - Show CORS configuration
   - Demonstrate token validation middleware

3. ✅ **Code Quality**
   - TypeScript strict mode
   - Comprehensive error handling
   - Logging strategy

**What You CANNOT Demo**:
- ❌ Live API calls to Dataverse
- ❌ Actual data fetching
- ❌ Canonical mapping with real data
- ❌ PDF generation

**Demo Flow**:
```
1. Show README.md - explain unified service
2. Show project structure - walk through folders
3. Show code improvements:
   - src/middleware/auth.middleware.ts (vs KF)
   - src/mappers/authorisedIndividualMapper.ts (8 flags)
   - src/services/pdf/pdfService.ts (orchestration)
4. Show test scripts (explain what they would do)
5. Show MERGE-SUMMARY.md (quantify improvements)
```

---

### Scenario B: With Client Secret (After Configuration)

**What You CAN Demo** (Everything!):

#### Demo 1: POC Endpoints (5 minutes)

**Objective**: Show Dataverse integration and canonical mapping

```bash
# 1. Start server
npm run dev

# 2. Health check (in browser or Postman)
GET http://localhost:3001/health

# 3. List records
GET http://localhost:3001/api/v1/authorised-individual/list

# Expected response:
{
  "success": true,
  "count": 5,
  "records": [
    {
      "id": "guid-here",
      "name": "John Doe",
      "firmName": "Example Firm Ltd"
    }
  ],
  "message": "Use one of these IDs for testing"
}

# 4. Get canonical DTO (replace with actual ID)
GET http://localhost:3001/api/v1/authorised-individual/{id}

# Expected response:
{
  "success": true,
  "data": {
    "Application": { ... },
    "Flags": {
      "RepOffice": false,
      "OtherNames": true,
      "ResidenceDurationLessThan3Years": false,
      "HasRegulatoryHistory": true
    },
    "LicensedFunctions": { ... },
    "PassportDetails": [ ... ],
    "Position": { ... }
  }
}

# 5. Conditional logic explanation
GET http://localhost:3001/api/v1/authorised-individual/{id}/conditional-demo

# Shows WHY each section is visible/hidden
```

**Key Talking Points**:
- ✅ "See how we fetch 71 fields from Dataverse"
- ✅ "Notice the 8 condition flags controlling visibility"
- ✅ "This shows Previous Address is hidden because residence >= 3 years"
- ✅ "Regulatory History table only appears if flag is true"

#### Demo 2: Conditional Mapping Logic (3 minutes)

**Objective**: Prove conditional logic works correctly

```bash
npm run test:mapper
```

**Expected Output**:
```
==========================================================
CONDITIONAL FLAGS (Control Section Visibility)
==========================================================

✅ TRUE  RepOffice
       If TRUE → Hide Licensed Functions section

❌ FALSE ResidenceDurationLessThan3Years
       If TRUE → Show Previous Address section

✅ TRUE  OtherNames
       If TRUE → Show Other Names subsection

==========================================================
SECTION VISIBILITY RESULTS
==========================================================

⬜ HIDDEN  [AUTH_PREV_ADDRESS] Previous Address
       Controlled by: ResidenceDurationLessThan3Years

✅ VISIBLE [AUTH_OTHER_NAMES] Other Names
       Controlled by: OtherNames
       Data present: {"StateOtherNames":"John Smith",...}
```

**Key Talking Points**:
- ✅ "8 boolean flags drive section visibility"
- ✅ "Mapper automatically includes/excludes sections based on flags"
- ✅ "This matches the canonical structure exactly"

#### Demo 3: Template Validation (2 minutes)

**Objective**: Show template system readiness

```bash
npm run test:template
```

**Expected Output** (without template):
```
❌ TEMPLATE NOT FOUND

Expected location: src/templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx

Next Steps:
  1. Open Microsoft Word
  2. Create document with DFSA layout
  3. Add placeholders using {FieldName} syntax
  4. Save as AuthorisedIndividual_v1.0.docx

Template Guide: src/templates/AuthorisedIndividual/README.md
```

**Key Talking Points**:
- ✅ "Service is ready for template"
- ✅ "Once template is created, PDF generation will work immediately"
- ✅ "Template guide shows all 71 fields available"

#### Demo 4: PDF Generation API (2 minutes)

**Objective**: Show API endpoint (even if template missing)

```bash
# Using Postman or curl
POST http://localhost:3001/api/pdf/generate
Content-Type: application/json

{
  "applicationId": "guid-from-list-endpoint",
  "documentType": "AuthorisedIndividual",
  "templateVersion": "1.0"
}
```

**Expected Response** (without template):
```json
{
  "success": false,
  "error": "Template Not Found",
  "message": "Template AuthorisedIndividual_v1.0.docx not found. Please ensure template file exists in templates/AuthorisedIndividual/ directory."
}
```

**Key Talking Points**:
- ✅ "API endpoint is ready and working"
- ✅ "Error handling is comprehensive"
- ✅ "Once template exists, this returns PDF URL"

---

## Recommended Demo Script (15 minutes)

### Part 1: Introduction (2 min)
- "We merged POC + Plan C into one unified service"
- "Show MERGE-SUMMARY.md statistics"
- "Highlight key improvements over KF reference"

### Part 2: Architecture Walkthrough (3 min)
- Show README.md architecture diagram
- Explain POC endpoints vs PDF generation pipeline
- Show project structure in VS Code

### Part 3: Live API Demo (5 min)
**Prerequisites**: Client secret must be configured

1. Start server: `npm run dev`
2. Health check: Show service is running
3. List records: Show Dataverse connection
4. Get record: Show canonical DTO with all 71 fields
5. Conditional demo: Explain why sections appear/disappear

### Part 4: Code Deep Dive (3 min)
- Show mapper: `src/mappers/authorisedIndividualMapper.ts`
  - Point out 8 condition flags (lines 35-63)
  - Show conditional rendering (lines 289-304)
- Show PDF service: `src/services/pdf/pdfService.ts`
  - Explain 6-step orchestration

### Part 5: Next Steps (2 min)
- "Template creation is the only blocker to full PDF generation"
- "Show template guide with placeholder syntax"
- "Demonstrate PDF conversion options (Graph API vs LibreOffice)"

---

## Quick Validation Commands

### Before Demo (Check Readiness)
```bash
# 1. Check environment variables
cat .env | grep -v "^#" | grep "="

# 2. Install dependencies (if not done)
npm install

# 3. Build TypeScript
npm run build

# 4. Test Dataverse (requires client secret)
npm run test:dataverse

# 5. Test mapper (requires client secret)
npm run test:mapper
```

### During Demo (Live Commands)
```bash
# Start server
npm run dev

# In another terminal - test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/authorised-individual/list
```

---

## Troubleshooting Demo Issues

### Issue: "Failed to obtain Dataverse access token"

**Cause**: `AZURE_CLIENT_SECRET` not set or incorrect

**Fix**:
1. Get client secret from Azure Portal:
   - Go to Azure AD → App Registrations
   - Select app `27c13640-86a9-4e1f-8f3f-5e631b8ba3b6`
   - Certificates & secrets → Client secrets
   - Copy value (if expired, create new one)

2. Update `.env`:
   ```env
   AZURE_CLIENT_SECRET=actual-secret-value-here
   ```

3. Restart server

### Issue: "No records found"

**Cause**: No Authorised Individual records in Dataverse

**Fix**:
- Create at least one test record in Dataverse
- OR use different entity for demo
- OR show with mock data explanation

### Issue: Server won't start

**Cause**: Port 3001 already in use

**Fix**:
```bash
# Change port in .env
PORT=3002

# Or kill process on 3001
# Windows: netstat -ano | findstr :3001
# Linux: lsof -ti:3001 | xargs kill
```

---

## Demo Preparation Checklist

### Minimal Demo (Architecture + Code Review)
- [ ] No configuration needed
- [x] README.md open and ready
- [x] VS Code with project open
- [x] MERGE-SUMMARY.md prepared
- [ ] Presentation slides (optional)

### Full Demo (Live API Calls)
- [ ] `AZURE_CLIENT_SECRET` configured in `.env`
- [ ] Dependencies installed: `npm install`
- [ ] Build successful: `npm run build`
- [ ] Dataverse test passes: `npm run test:dataverse`
- [ ] Mapper test passes: `npm run test:mapper`
- [ ] Postman collection prepared with endpoints
- [ ] At least 1 test record exists in Dataverse
- [ ] Server can start: `npm run dev`

### Complete Demo (Including PDF Generation)
- All "Full Demo" items above, PLUS:
- [ ] DOCX template created at `src/templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx`
- [ ] Template test passes: `npm run test:template`
- [ ] PDF conversion configured (Graph API or LibreOffice)
- [ ] Optional: Blob storage configured

---

## Summary: What Can You Show Right Now?

### Without Client Secret ⚠️
**Level**: Architecture & Code Review Only
- ✅ Codebase walkthrough
- ✅ Improvements documentation
- ✅ Test script explanations
- ❌ No live API calls

### With Client Secret ✅
**Level**: Full POC Demonstration
- ✅ All POC endpoints working
- ✅ Real Dataverse data
- ✅ Conditional mapping live
- ✅ Service fully functional
- ⚠️ PDF generation (needs template)

### With Client Secret + Template 🎯
**Level**: Complete End-to-End Demo
- ✅ Everything above
- ✅ PDF generation working
- ✅ Full pipeline demonstration
- ✅ Production-ready showcase

---

**Recommendation**:
1. **Get client secret FIRST** to unlock POC demonstration
2. Create template LATER for full PDF generation demo
3. For now, focus on POC endpoints to show Dataverse integration works

**Estimated Setup Time**:
- Get client secret: 5 minutes
- Test and validate: 5 minutes
- **Total to demo-ready: 10 minutes**
