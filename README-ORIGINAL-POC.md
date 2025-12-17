# DFSA PDF Service POC

> **Proof of Concept**: Dataverse Integration → Express Middleware → Conditional Mapping

This POC demonstrates the viability of using an Express.js middleware service to:
1. **Fetch data from Dataverse** (Authorised Individual form)
2. **Map to canonical structure** (71 fields from colleague's canonical CSV)
3. **Demonstrate conditional logic** (8 condition flags controlling section visibility)

## 🎯 POC Goals

✅ **Show we can integrate with Dataverse** - Fetch specific records using Azure AD authentication
✅ **Prove canonical mapping works** - Transform Dataverse fields to standardized DTO
✅ **Demonstrate conditional rendering** - Flags control which sections appear in final PDF

## 🏗️ Architecture

Based on **Khalifa Fund (KF) Express middleware pattern**, adapted for DFSA with security hardening:

```
Power Pages (future)
        ↓
   Express API (this POC)
        ↓
   Dataverse Client (Azure AD auth)
        ↓
   Authorised Individual Mapper
        ↓
   Canonical DTO (ready for PDF template)
```

### Key Differences from KF Implementation

| Component | KF Pattern | DFSA POC |
|-----------|-----------|----------|
| **Entity** | `kf_customerexperience` | `dfsa_authorised_individual` |
| **Auth** | Unverified token decode | Azure AD token validation |
| **CORS** | `origin: true` (wide open) | Restricted to allowed origins |
| **Mapping** | Inline in controller | Separate mapper module with types |
| **Conditional Logic** | N/A | 8 flags + complex section visibility |

## 📁 Project Structure

```
dfsa-pdf-service-poc/
├── src/
│   ├── config/
│   │   └── env.ts                    # Environment configuration
│   ├── controllers/
│   │   └── authorisedIndividualController.ts  # Request handlers
│   ├── mappers/
│   │   └── authorisedIndividualMapper.ts      # ⭐ Canonical mapping + conditional logic
│   ├── middleware/
│   │   ├── auth.middleware.ts        # Token validation (hardened vs KF)
│   │   ├── error.middleware.ts       # Error handling
│   │   └── request.middleware.ts     # Request ID, logging
│   ├── routes/
│   │   └── authorisedIndividualRoutes.ts
│   ├── services/
│   │   └── dataverse/
│   │       └── dataverseClient.ts    # ⭐ Dataverse API client (adapted from KF)
│   ├── tests/
│   │   ├── test-dataverse.ts         # Test Dataverse connection
│   │   └── test-mapper.ts            # Test conditional mapping
│   ├── types/
│   │   └── authorisedIndividual.ts   # TypeScript interfaces
│   ├── utils/
│   │   └── logger.ts                 # Winston logger
│   └── index.ts                      # Express app entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure AD App Registration with:
  - Client ID
  - Client Secret
  - Tenant ID
  - Dataverse API permissions

### Installation

1. **Clone/navigate to POC directory:**
   ```bash
   cd c:\Users\STEPH\Documents\DigitalQatalyst\DFSA\dfsa-pdf-service-poc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-client-id
   AZURE_CLIENT_SECRET=your-secret
   DATAVERSE_URL=https://your-org.crm.dynamics.com
   ```

4. **Test Dataverse connection:**
   ```bash
   npm run test:dataverse
   ```

   Expected output:
   ```
   ✅ Token acquired successfully
   ✅ Found 5 record(s)
   ✅ Record fetched successfully
   ```

5. **Test conditional mapping:**
   ```bash
   npm run test:mapper
   ```

   Expected output shows which flags are TRUE/FALSE and which sections are visible/hidden.

6. **Start development server:**
   ```bash
   npm run dev
   ```

   Server starts on `http://localhost:3001`

## 🔍 POC Endpoints

### 1. List Records
```bash
GET http://localhost:3001/api/v1/authorised-individual/list
```

Returns recent Authorised Individual records with IDs (use these for testing).

### 2. Get Mapped Record
```bash
GET http://localhost:3001/api/v1/authorised-individual/{id}
```

**Demonstrates:**
- ✅ Dataverse fetch with all 71 fields + related entities
- ✅ Canonical mapping
- ✅ Conditional flags evaluation
- ✅ Repeating sections (passport details, citizenships, regulatory history)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "Application": {
      "Id": "guid",
      "FirmName": "Example Firm",
      "PreviousAddress": null  // ← Hidden because residence >= 3 years
    },
    "Flags": {
      "RepOffice": false,
      "ResidenceDurationLessThan3Years": false,  // ← Controls Previous Address visibility
      "OtherNames": true,                        // ← Controls Other Names section
      "HasRegulatoryHistory": true               // ← Controls Regulatory History table
    },
    "LicensedFunctions": {
      "ShowLicensedFunctionsSection": true       // ← Shown because RepOffice = false
    },
    "PassportDetails": [
      { "FullName": "John Doe", "DateOfBirth": "1985-05-20" }
    ],
    "RegulatoryHistory": [
      { "Regulator": "FCA (UK)", "DateStarted": "2010-01-01" }
    ]
  },
  "metadata": {
    "conditionalSections": {
      "showPreviousAddress": false,
      "showOtherNames": true,
      "showLicensedFunctions": true,
      "showRegulatoryHistory": true
    }
  }
}
```

### 3. Conditional Logic Demo
```bash
GET http://localhost:3001/api/v1/authorised-individual/{id}/conditional-demo
```

**Demonstrates:**
- Detailed explanation of WHY each section is shown/hidden
- Maps Dataverse field values to flags
- Shows expected vs actual values

**Example Response:**
```json
{
  "success": true,
  "explanation": {
    "flags": { "RepOffice": false, "OtherNames": true, ... },
    "sections": [
      {
        "sectionCode": "AUTH_PREV_ADDRESS",
        "sectionName": "Previous Address",
        "visible": false,
        "reason": "Candidate has lived at current address for 3 years or more",
        "dataverseField": "cr5f7_howlonghasthecandidateresidedattheabov",
        "dataverseValue": 612320001,
        "expectedValue": 612320000
      }
    ]
  }
}
```

## 🎓 Key POC Demonstrations

### 1. Conditional Flag Evaluation

**Location:** [src/mappers/authorisedIndividualMapper.ts](src/mappers/authorisedIndividualMapper.ts#L16-L47)

```typescript
function buildConditionFlags(record: DataverseAuthorisedIndividualRecord): ConditionFlags {
  return {
    // Example: Controls Previous Address section
    ResidenceDurationLessThan3Years:
      record.cr5f7_howlonghasthecandidateresidedattheabov === 612320000,

    // Example: Controls Licensed Functions section
    RepOffice: record.dfsa_ai_isthecandidateapplyingonbehalfofarepres === true,

    // ... 6 more flags
  };
}
```

### 2. Section Visibility Based on Flags

**Location:** [src/mappers/authorisedIndividualMapper.ts](src/mappers/authorisedIndividualMapper.ts#L285-L300)

```typescript
// Previous Address: Only shown if residence < 3 years
PreviousAddress: flags.ResidenceDurationLessThan3Years
  ? {
      Address: record.dfsa_buildingnamenumber || '',
      PostCode: record.dfsa_postcode_pobox || '',
      Country: formatChoiceLabel(record.dfsa_country2)
    }
  : null,  // ← Returns null if flag is false
```

### 3. Complex Conditional Logic (Licensed Functions)

**Location:** [src/mappers/authorisedIndividualMapper.ts](src/mappers/authorisedIndividualMapper.ts#L79-L117)

```typescript
function buildLicensedFunctions(record, flags) {
  return {
    // Hide entire section if applying for Rep Office
    ShowLicensedFunctionsSection: !flags.RepOffice,

    // Hide mandatory functions if Responsible Officer selected
    ShowMandatoryFunctionsQuestion:
      !flags.RepOffice &&
      licensedFunctionChoice !== null &&
      licensedFunctionChoice !== 4,

    // Show Responsible Officer confirmations only for specific choice
    ShowResponsibleOfficerConfirmations:
      !flags.RepOffice && isResponsibleOfficer
  };
}
```

## 🔐 Security Hardening vs KF

| Security Aspect | KF Implementation | DFSA POC |
|----------------|-------------------|----------|
| **CORS** | `origin: true` (allows ANY origin) | Whitelist only (Power Pages + localhost) |
| **Token Validation** | Unverified decode | Azure AD validation |
| **Error Messages** | Full stack traces | Sanitized in production |
| **Payload Limit** | 10MB | 1MB |

## 📊 Canonical Structure Mapping

Based on colleague's canonical structure CSV (71 fields):

| Step | Fields | Mapping Status |
|------|--------|----------------|
| 0.1 | 1 field (Guidelines) | ✅ Mapped |
| 0.2 | 1 field (DIFC Disclosure) | ✅ Mapped |
| 0.3 | 7 fields (Firm + Requestor) | ✅ Mapped |
| 1.1 | 62 fields + 3 related entities | ✅ Mapped |

**Condition Flags:** 8/8 implemented
**Repeating Sections:** 3/3 implemented (Passport Details, Citizenships, Regulatory History)

## 🧪 Testing

### Run All Tests
```bash
npm run validate:all
```

### Individual Tests
```bash
# Test Dataverse connection
npm run test:dataverse

# Test mapper with conditional logic
npm run test:mapper
```

## 📝 Next Steps (Post-POC)

After validating this POC works:

1. **Add DOCX Template Engine** (docxtemplater)
2. **Add PDF Conversion** (LibreOffice or Graph API)
3. **Add Storage Service** (save PDF to Dataverse as annotation)
4. **Create Power Pages Integration** (button to trigger PDF generation)
5. **Add Audit Logging** (track who generated what, when)
6. **Production Hardening:**
   - Full Azure AD token verification (MSAL)
   - Rate limiting per user
   - Redis-based queue for async processing
   - Circuit breaker for Dataverse calls

## 🐛 Troubleshooting

### "Failed to obtain Dataverse access token"
- Check `.env` credentials (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
- Verify app registration has Dataverse permissions
- Check if admin consent was granted

### "Record not found"
- Run `npm run test:dataverse` to see available record IDs
- Create test record in Dataverse if none exist

### "CORS blocked"
- Add your origin to `ALLOWED_ORIGINS` in `.env`
- For localhost testing, `http://localhost:3000` is already allowed

## 📚 References

- [Colleague's Canonical Structure](../canonical-structure-authorised-individual.md)
- [KF Reference Implementation](../../KF/kfrealexpressserver)
- [Plan C Specification](../plan-c-specification.md)

---

**POC Status:** ✅ Ready for demonstration
**Target Form:** Authorised Individual (Steps 0.1, 0.2, 0.3, 1.1)
**Last Updated:** 2025-12-17
