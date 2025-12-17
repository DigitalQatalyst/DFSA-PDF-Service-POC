# Setup Guide: DFSA PDF Service POC

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd c:\Users\STEPH\Documents\DigitalQatalyst\DFSA\dfsa-pdf-service-poc
npm install
```

### Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   # Azure AD Authentication
   AZURE_TENANT_ID=your-tenant-id-from-colleague
   AZURE_CLIENT_ID=your-client-id-from-colleague
   AZURE_CLIENT_SECRET=your-client-secret-from-colleague

   # Dataverse Configuration
   DATAVERSE_URL=https://your-dfsa-org.crm.dynamics.com

   # Development Settings (leave as-is)
   NODE_ENV=development
   PORT=3001
   LOG_LEVEL=debug
   ```

### Step 3: Verify Dataverse Connection

```bash
npm run test:dataverse
```

**Expected Output:**
```
✅ Token acquired successfully
✅ Found 5 record(s)
✅ Record fetched successfully
```

If you see errors, check the Troubleshooting section below.

### Step 4: Test Conditional Mapping

```bash
npm run test:mapper
```

**Expected Output:**
```
✅ TRUE  OtherNames
       If TRUE → Show Other Names subsection

✅ VISIBLE [AUTH_OTHER_NAMES] Other Names
       Controlled by: OtherNames

📋 Passport Details: 1 record(s)
   1. John Doe (1985-05-20)

✅ MAPPER TEST PASSED
```

### Step 5: Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

### Step 6: Test Endpoints

1. **List records** (to find IDs):
   ```bash
   curl http://localhost:3001/api/v1/authorised-individual/list
   ```

2. **Get mapped record** (use ID from step 1):
   ```bash
   curl http://localhost:3001/api/v1/authorised-individual/{id}
   ```

3. **Get conditional demo**:
   ```bash
   curl http://localhost:3001/api/v1/authorised-individual/{id}/conditional-demo
   ```

## 🎯 What This POC Demonstrates

### 1. Dataverse Integration ✅

**File:** [src/services/dataverse/dataverseClient.ts](src/services/dataverse/dataverseClient.ts)

- Azure AD authentication using service principal
- Token caching (reduces API calls)
- Fetches Authorised Individual with all 71 fields
- Includes related entities (passport details, citizenships, regulatory history)

### 2. Canonical Structure Mapping ✅

**File:** [src/mappers/authorisedIndividualMapper.ts](src/mappers/authorisedIndividualMapper.ts)

- Maps 71 fields from Dataverse to canonical DTO
- Implements 8 condition flags
- Handles 3 repeating sections

### 3. Conditional Logic ✅

**8 Condition Flags:**

| Flag | Controls | Example |
|------|----------|---------|
| `RepOffice` | Licensed Functions section | If true → hide section |
| `ResidenceDurationLessThan3Years` | Previous Address section | If true → show section |
| `OtherNames` | Other Names subsection | If true → show 4 fields |
| `HasRegulatoryHistory` | Regulatory History table | If true → show repeating table |
| `HasStartDate` | Start date vs explanation | If true → show date, else explanation |
| `PreviouslyHeld` | Candidate lookup | If true → show lookup field |
| `LicensedFunctionSelected` | Mandatory functions | Controls visibility |

**Example Conditional Section:**

```typescript
// Previous Address: Only shown if residence < 3 years
PreviousAddress: flags.ResidenceDurationLessThan3Years
  ? {
      Address: record.dfsa_buildingnamenumber || '',
      PostCode: record.dfsa_postcode_pobox || '',
      Country: formatChoiceLabel(record.dfsa_country2)
    }
  : null  // Hidden if flag is false
```

## 🔧 Troubleshooting

### Error: "Failed to obtain Dataverse access token"

**Cause:** Incorrect Azure AD credentials or missing permissions.

**Fix:**
1. Check `.env` file has correct values:
   - `AZURE_TENANT_ID`
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`

2. Verify app registration has Dataverse permissions:
   - Go to Azure Portal → App Registrations → Your App
   - Check "API Permissions" includes Dynamics CRM
   - Verify "Admin consent granted" shows ✅

3. Verify application user exists in Dataverse:
   - Go to Power Platform Admin Center → Environments → Your Env
   - Settings → Users + permissions → Application users
   - Look for your app (by Client ID)

### Error: "Record not found"

**Cause:** No Authorised Individual records in Dataverse or using wrong GUID.

**Fix:**
1. Run `npm run test:dataverse` to see available IDs
2. If no records shown, create test record in Power Pages or Dynamics 365
3. Copy one of the GUIDs and use it in your API calls

### Error: "CORS blocked"

**Cause:** Your frontend origin is not in the allowed list.

**Fix:**
Add your origin to `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://your-power-pages-url.com
```

### Error: "Cannot find module"

**Cause:** Dependencies not installed or TypeScript not compiled.

**Fix:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build TypeScript
npm run build
```

## 📂 Project Files Reference

### Core Files (Start Here)

| File | Purpose |
|------|---------|
| [src/index.ts](src/index.ts) | Express server entry point |
| [src/services/dataverse/dataverseClient.ts](src/services/dataverse/dataverseClient.ts) | Dataverse API client |
| [src/mappers/authorisedIndividualMapper.ts](src/mappers/authorisedIndividualMapper.ts) | Canonical mapping + conditional logic |
| [src/controllers/authorisedIndividualController.ts](src/controllers/authorisedIndividualController.ts) | API endpoint handlers |

### Configuration

| File | Purpose |
|------|---------|
| [.env](.env) | Environment variables (credentials) |
| [src/config/env.ts](src/config/env.ts) | Environment validation |
| [package.json](package.json) | Dependencies and scripts |
| [tsconfig.json](tsconfig.json) | TypeScript configuration |

### Testing

| File | Purpose |
|------|---------|
| [src/tests/test-dataverse.ts](src/tests/test-dataverse.ts) | Test Dataverse connection |
| [src/tests/test-mapper.ts](src/tests/test-mapper.ts) | Test conditional mapping |

## 🚀 Next Steps After POC Validation

Once you've verified the POC works:

1. **Week 1: Add PDF Generation**
   - Integrate docxtemplater
   - Create DOCX template for Authorised Individual
   - Add PDF conversion (LibreOffice or Graph API)

2. **Week 2: Add Storage & Integration**
   - Save PDF to Dataverse as annotation
   - Create Power Pages button to trigger generation
   - Add audit logging

3. **Production Hardening:**
   - Full Azure AD token verification (not just decode)
   - Rate limiting per user
   - Circuit breaker for Dataverse calls
   - Application Insights integration

## 📞 Getting Help

If you encounter issues:

1. **Check logs:** Look in `logs/combined.log` and `logs/error.log`
2. **Enable debug logging:** Set `LOG_LEVEL=debug` in `.env`
3. **Review error messages:** They include hints for common issues
4. **Check Dataverse connectivity:** Run `npm run test:dataverse` first

## 📊 Success Criteria

Your POC is working correctly if:

✅ `npm run test:dataverse` shows records
✅ `npm run test:mapper` shows conditional flags and sections
✅ `npm run dev` starts server without errors
✅ `curl http://localhost:3001/api/v1/authorised-individual/list` returns data
✅ Conditional demo endpoint explains why sections are shown/hidden

---

**Ready for next step?** See [README.md](README.md) for API documentation.
