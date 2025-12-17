# DFSA PDF Generation Service
## Unified POC + Production Pipeline

> **Complete Solution**: Dataverse Integration → Canonical Mapping → DOCX Template → PDF Generation → Storage

This service combines:
1. **POC Demonstration Endpoints** - Show Dataverse integration, canonical mapping, and conditional logic
2. **PDF Generation Pipeline** - Full end-to-end DOCX template rendering and PDF conversion (Plan C implementation)

## 🎯 Service Capabilities

### POC & Demonstration
✅ **Dataverse Integration** - Fetch specific records using Azure AD authentication
✅ **Canonical Structure Mapping** - Transform 71 fields from Dataverse to standardized DTO
✅ **Conditional Logic** - 8 condition flags controlling section visibility
✅ **Demonstration Endpoints** - List records, get canonical data, explain conditional logic

### PDF Generation (Plan C)
✅ **DOCX Templating** - docxtemplater-based document generation
✅ **PDF Conversion** - Microsoft Graph API or LibreOffice headless converter
✅ **Azure Blob Storage** - Optional PDF storage with metadata
✅ **Multiple Conversion Engines** - Pluggable converters (Graph, LibreOffice)
✅ **Repeating Sections** - Tables for passport details, citizenships, regulatory history

## 🏗️ Architecture

```
Power Pages / External System
           ↓
   Express API Server
           ↓
   ┌───────┴────────┐
   │                │
POC Endpoints    PDF Generation
   │                │
   │            Dataverse Fetch
   │                │
   │            Canonical Mapper
   │                │
   │            DOCX Service
   │                │
   │            PDF Converter
   │                │
   │            Blob Storage
   └────────────────┘
```

### Comparison: POC vs pdf-rendering-service vs Unified

| Aspect | Original POC | pdf-rendering-service | **Unified Service** |
|--------|-------------|---------------------|-------------------|
| **Purpose** | Demonstration | Production Pipeline | **Both** |
| **Dataverse** | ✅ Fetch only | ✅ Fetch only | ✅ **Fetch + Query** |
| **Canonical Mapping** | ✅ Complete | ✅ Complete | ✅ **Enhanced** |
| **PDF Generation** | ❌ | ✅ Complete | ✅ **Complete** |
| **Template Engine** | ❌ | ✅ docxtemplater | ✅ **docxtemplater** |
| **PDF Conversion** | ❌ | ✅ Graph + LibreOffice | ✅ **Graph + LibreOffice** |
| **Storage** | ❌ | ✅ Blob Storage | ✅ **Blob Storage** |
| **Demo Endpoints** | ✅ 3 endpoints | ❌ | ✅ **3 + 2 PDF endpoints** |
| **Security** | ✅ CORS, Token validation | ⚠️ Basic | ✅ **Hardened** |
| **Position Section** | ✅ | ⚠️ Partial | ✅ **Complete** |

## 📁 Project Structure

```
dfsa-pdf-service-poc/  (UNIFIED)
├── src/
│   ├── config/
│   │   └── env.ts                              # Environment configuration
│   ├── controllers/
│   │   ├── authorisedIndividualController.ts   # POC demonstration endpoints
│   │   └── pdfController.ts                    # PDF generation endpoints
│   ├── mappers/
│   │   └── authorisedIndividualMapper.ts       # ⭐ Canonical mapping (71 fields, 8 flags)
│   ├── middleware/
│   │   ├── auth.middleware.ts                  # Azure AD token validation
│   │   ├── error.middleware.ts                 # Error handling
│   │   └── request.middleware.ts               # Request ID, logging
│   ├── routes/
│   │   ├── authorisedIndividualRoutes.ts       # POC routes
│   │   └── pdfRoutes.ts                        # PDF generation routes
│   ├── services/
│   │   ├── dataverse/
│   │   │   └── dataverseClient.ts              # Dataverse API client
│   │   ├── templating/
│   │   │   └── docxService.ts                  # DOCX template rendering
│   │   ├── pdf/
│   │   │   ├── pdfConverter.ts                 # PDF conversion router
│   │   │   ├── pdfService.ts                   # Orchestration service
│   │   │   └── converters/
│   │   │       ├── graphConverter.ts           # Microsoft Graph converter
│   │   │       └── libreOfficeConverter.ts     # LibreOffice converter
│   │   └── storage/
│   │       └── storageService.ts               # Azure Blob Storage
│   ├── templates/
│   │   └── AuthorisedIndividual/
│   │       ├── AuthorisedIndividual_v1.0.docx  # DOCX template (user-created)
│   │       └── README.md                       # Template guide
│   ├── tests/
│   │   ├── test-dataverse.ts                   # Test Dataverse connection
│   │   ├── test-mapper.ts                      # Test conditional mapping
│   │   ├── test-template.ts                    # Validate template exists
│   │   └── test-pdf-generation.ts              # Full pipeline test
│   ├── types/
│   │   └── authorisedIndividual.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── logger.ts                           # Winston logger
│   └── index.ts                                # Express app entry point
├── package.json                                # Unified dependencies
├── tsconfig.json                              # TypeScript config
├── .env.example                               # Config template
└── README-UNIFIED.md                          # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure AD App Registration with:
  - Client ID, Client Secret, Tenant ID
  - Dataverse API permissions
- Optional (for PDF generation):
  - Microsoft Graph API permissions OR LibreOffice installed
  - Azure Blob Storage account

### Installation

1. **Navigate to service directory:**
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
   # Edit .env with your credentials
   ```

   **Minimum Configuration (POC only):**
   ```env
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-client-id
   AZURE_CLIENT_SECRET=your-secret
   DATAVERSE_URL=https://your-org.crm.dynamics.com
   ```

   **Full Configuration (PDF Generation):**
   ```env
   # Add PDF conversion engine
   PDF_CONVERSION_ENGINE=graph  # or libreoffice

   # Add Graph API credentials (if using graph)
   GRAPH_TENANT_ID=your-tenant-id
   GRAPH_CLIENT_ID=your-client-id
   GRAPH_CLIENT_SECRET=your-secret

   # Add blob storage (optional)
   AZURE_STORAGE_CONNECTION_STRING=your-connection-string
   AZURE_STORAGE_CONTAINER_NAME=pdf-documents
   ```

4. **Test Dataverse connection:**
   ```bash
   npm run test:dataverse
   ```

5. **Test conditional mapping:**
   ```bash
   npm run test:mapper
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```
   Server starts on `http://localhost:3001`

## 🔍 API Endpoints

### POC & Demonstration Endpoints

#### 1. List Records
```http
GET /api/v1/authorised-individual/list
```
Returns recent Authorised Individual records with IDs for testing.

#### 2. Get Canonical DTO
```http
GET /api/v1/authorised-individual/{id}
```
Demonstrates:
- Dataverse fetch with all 71 fields
- Canonical mapping
- Conditional flags evaluation
- Repeating sections

**Example Response:**
```json
{
  "success": true,
  "data": {
    "Application": { ... },
    "Flags": {
      "RepOffice": false,
      "ResidenceDurationLessThan3Years": false,
      "OtherNames": true,
      "HasRegulatoryHistory": true
    },
    "LicensedFunctions": { ... },
    "PassportDetails": [ ... ],
    "Citizenships": [ ... ],
    "RegulatoryHistory": [ ... ],
    "Position": { ... }
  }
}
```

#### 3. Conditional Logic Explanation
```http
GET /api/v1/authorised-individual/{id}/conditional-demo
```
Returns detailed explanation of WHY each section is shown/hidden with Dataverse field mappings.

### PDF Generation Endpoints

#### 4. Generate PDF
```http
POST /api/pdf/generate
```

**Request Body:**
```json
{
  "applicationId": "guid",
  "documentType": "AuthorisedIndividual",
  "templateVersion": "1.0",
  "returnBuffer": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pdfUrl": "https://storage.blob.core.windows.net/...",
    "applicationId": "guid",
    "documentType": "AuthorisedIndividual",
    "templateVersion": "1.0",
    "generatedAt": "2025-12-17T10:00:00.000Z",
    "conversionEngine": "graph",
    "duration": "1234ms"
  }
}
```

#### 5. Validate Template
```http
GET /api/pdf/validate-template/{documentType}/{version}
```
Check if DOCX template exists before attempting PDF generation.

## 🧪 Testing

### Run All Tests
```bash
npm run validate:all
```
Runs: test:dataverse → test:mapper → test:template

### Individual Tests
```bash
# Test Dataverse connection
npm run test:dataverse

# Test canonical mapper with conditional logic
npm run test:mapper

# Validate template file exists
npm run test:template

# Test full PDF generation pipeline
npm run test:pdf
```

## 📋 Conditional Logic (8 Flags)

| Flag | Dataverse Field | Purpose | Impact |
|------|----------------|---------|--------|
| `RepOffice` | `dfsa_ai_isthecandidateapplyingonbehalfofarepres` | Representative Office | Hides Licensed Functions section |
| `OtherNames` | `dfsa_hasthecandidateeverusedothernamesorchanged` | Has used other names | Shows Other Names subsection (4 fields) |
| `ResidenceDurationLessThan3Years` | `cr5f7_howlonghasthecandidateresidedattheabov` | Residence < 3 years | Shows Previous Address section |
| `HasRegulatoryHistory` | `dfsa_doesthecandidateholdorhaspreviouslyheldin` | Has regulatory licenses | Shows Regulatory History table |
| `HasStartDate` | `new_ai_doyouhaveproposedstartingdate` | Has proposed start date | Shows date field vs explanation |
| `PreviouslyHeld` | `dfsa_hasthecandidatepreviouslyheldauthorisedindiv` | Previously held position | Shows candidate lookup |
| `LicensedFunctionSelected` | `dfsa_pleaseselectthelicensedfunctiontobecarried` | Selected a licensed function | Enables function-specific fields |

## 📊 Canonical Structure (71 Fields)

Based on colleague's canonical CSV, fully mapped:

- **Guidelines** (1 field) - Confirm read
- **DIFC Disclosure** (1 field) - Consent to disclosure
- **Application Info** (7 fields) - Firm details + Requestor
- **Contact** (5 fields) - Current address and contact details
- **Previous Address** (3 fields) - **CONDITIONAL**
- **Other Names** (4 fields) - **CONDITIONAL**
- **Passport Details** (8 fields per record) - **REPEATING**
- **Citizenships** (3 fields per record) - **REPEATING**
- **Licensed Functions** (14 fields) - Complex conditional logic
- **Regulatory History** (8 fields per record) - **REPEATING + CONDITIONAL**
- **Position** (5 fields) - Job title, start date

**Total**: 71 fields + 3 repeating sections + 8 condition flags

## 📝 Creating the DOCX Template

The service requires a DOCX template file created in Microsoft Word.

**Location**: `src/templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx`

**Guide**: [src/templates/AuthorisedIndividual/README.md](src/templates/AuthorisedIndividual/README.md)

### Template Syntax Examples

**Simple Fields:**
```
{Application.FirmName}
{Application.AuthorisedIndividualName}
```

**Conditional Sections:**
```
{#Flags.OtherNames}
Previous Names: {Application.OtherNames.StateOtherNames}
{/Flags.OtherNames}
```

**Repeating Sections:**
```
{#PassportDetails}
- {FullName}, DOB: {DateOfBirth}
{/PassportDetails}
```

**Boolean Display:**
```
{#DIFCDisclosure.ConsentToDisclosure}Yes{/DIFCDisclosure.ConsentToDisclosure}
{^DIFCDisclosure.ConsentToDisclosure}No{/DIFCDisclosure.ConsentToDisclosure}
```

## 🔐 Security Hardening (vs KF Reference)

| Security Aspect | KF Implementation | DFSA Unified Service |
|----------------|-------------------|---------------------|
| **CORS** | `origin: true` (allows ANY origin) | Whitelist only |
| **Token Validation** | Unverified JWT decode | Azure AD validation with expiry checks |
| **Error Messages** | Full stack traces | Sanitized in production |
| **Payload Limit** | 10MB | 1MB |
| **Token Caching** | None | 5-minute expiry buffer |
| **HTTPS Headers** | None | Helmet.js security headers |

## 🚢 Deployment Options

### Azure Functions
- Consumption or Premium plan
- Environment variables via App Settings
- Managed identity for Dataverse/Graph API

### Azure App Service
- Linux or Windows container
- Integrated with Azure Blob Storage
- Auto-scaling support

### Docker Container
- Dockerfile provided
- Supports both PDF conversion engines
- Environment-based configuration

## 📚 Next Steps

### Phase 1: POC Validation (Current)
- ✅ Dataverse integration
- ✅ Canonical mapping
- ✅ Conditional logic
- ✅ PDF generation infrastructure

### Phase 2: Template Creation
- ⏳ Create DOCX template in Word
- ⏳ Test template with sample data
- ⏳ Validate all placeholders

### Phase 3: PDF Configuration
- ⏳ Configure Graph API or LibreOffice
- ⏳ Test PDF conversion
- ⏳ Configure blob storage

### Phase 4: Power Pages Integration
- ⏳ Add "Generate PDF" button to Power Pages
- ⏳ Call `/api/pdf/generate` endpoint
- ⏳ Display generated PDF URL

### Phase 5: Production Hardening
- ⏳ Add rate limiting per user
- ⏳ Implement Redis-based queue
- ⏳ Add circuit breaker for Dataverse calls
- ⏳ Implement audit logging

## 🐛 Troubleshooting

### "Failed to obtain Dataverse access token"
- Check `.env` credentials (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
- Verify app registration has Dataverse permissions
- Ensure admin consent was granted

### "Template not found"
- Create template file: `src/templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx`
- See template guide: `src/templates/AuthorisedIndividual/README.md`

### "PDF conversion failed"
**Graph API:**
- Check GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET
- Ensure app has Microsoft Graph permissions (Files.ReadWrite.All)
- Verify OneDrive/SharePoint access

**LibreOffice:**
- Ensure LibreOffice is installed: `soffice --version`
- Check soffice command is in PATH
- Install via: `sudo apt-get install libreoffice` (Linux)

### "Blob storage failed"
- Check AZURE_STORAGE_CONNECTION_STRING format
- Verify storage account exists
- PDF generation continues without storage (warning logged)

## 📞 Support

- **Issues**: Create issue at GitHub repository
- **Documentation**: See [SETUP.md](SETUP.md) for detailed setup
- **API Reference**: See [API-QUICK-REFERENCE.md](API-QUICK-REFERENCE.md)

---

**Service Status**: ✅ Unified and ready for demonstration + PDF generation
**Target Form**: Authorised Individual (Steps 0.1, 0.2, 0.3, 1.1)
**Last Updated**: 2025-12-17

**Improvements Implemented:**
- ✅ Merged POC + pdf-rendering-service into single unified service
- ✅ Enhanced security (CORS, token validation, error sanitization)
- ✅ Complete Position section mapping
- ✅ Improved token caching with expiry buffer
- ✅ Graceful fallbacks for PDF storage
- ✅ Comprehensive test suite
- ✅ Template creation guide with full data structure reference
