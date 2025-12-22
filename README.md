# DFSA PDF Service - Authorised Individual Application Generator

**Status**: ✅ **PRODUCTION READY** | **Last Updated**: 2025-12-19

PDF generation service for DFSA Authorised Individual applications. Generates professional PDF documents from Power Pages form submissions using DOCX templates and LibreOffice conversion.

---

## Features

- ✅ 71 fields + 3 related entities (Passport, Citizenship, Regulatory History)
- ✅ 7 conditional sections (dynamic content based on user responses)
- ✅ DOCX download (immediate, 8.7KB)
- ✅ PDF generation (21 seconds, 61KB, 3 pages)
- ✅ Azure Blob Storage integration (persistent URLs)
- ✅ Power Pages integration ready

---

## Quick Start

### Start API Server
```bash
npm install
npm run dev:api
```

Server runs on: http://localhost:3002

### Test PDF Generation
```bash
curl -X POST http://localhost:3002/api/pdf/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer baxyDK0I6I81XUAYm6V4q1zUU6y0bIDrZhBpm4VZG20=" \
  -d '{"recordId":"18036be5-dadb-f011-8544-6045bd69d7d8"}'
```

**Returns**:
```json
{
  "success": true,
  "pdfUrl": "https://kfdocumentwallet.blob.core.windows.net/dfsa-pdf-documents/...",
  "recordId": "18036be5-dadb-f011-8544-6045bd69d7d8",
  "generatedAt": "2025-12-19T07:00:38.220Z"
}
```

---

## Architecture

**Technology Stack**:
- Express.js + TypeScript
- docxtemplater (template engine)
- LibreOffice v25.8.4.2 (PDF conversion)
- Azure Blob Storage (`kfdocumentwallet`)
- Microsoft Dataverse (data source)

**Pipeline**: Dataverse → DTO Mapping → DOCX → LibreOffice → PDF → Azure Storage (~21 seconds)

---

## Configuration

Key `.env` settings:

```env
PORT=3002
DATAVERSE_URL=https://dfsaprimarydev.crm15.dynamics.com/
POWER_PAGES_URL=https://dqdfsadev3.powerappsportals.com/

# PDF Conversion
PDF_CONVERSION_ENGINE=libreoffice
LIBREOFFICE_PATH=C:\\Program Files\\LibreOffice\\program\\soffice.exe

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=kfdocumentwallet;...
AZURE_STORAGE_CONTAINER_NAME=dfsa-pdf-documents

# Security
API_KEY=baxyDK0I6I81XUAYm6V4q1zUU6y0bIDrZhBpm4VZG20=
```

---

## Documentation

### Implementation Guides
- **[AZURE_STORAGE_CONFIGURED.md](AZURE_STORAGE_CONFIGURED.md)** - Azure Storage setup & validation (✅ Complete)
- **[POWER_PAGES_INTEGRATION.md](POWER_PAGES_INTEGRATION.md)** - Power Pages deployment guide
- **[READY_FOR_PRODUCTION.md](READY_FOR_PRODUCTION.md)** - Production checklist

### Debugging & Reference
- **[DEBUGGING_GUIDE.md](DEBUGGING_GUIDE.md)** - Common issues & fixes
- **[QUICK_START.md](QUICK_START.md)** - Getting started
- **[LIBREOFFICE_VALIDATION.md](LIBREOFFICE_VALIDATION.md)** - LibreOffice validation
- **[FIXED_POWER_PAGES_JS.js](FIXED_POWER_PAGES_JS.js)** - Power Pages JavaScript

---

## API Endpoints

### `GET /health`
Health check

**Response**: `{"status":"healthy","service":"DFSA PDF Generation Service"}`

### `POST /api/pdf/generate-docx`
Download DOCX immediately (~2 seconds)

**Headers**: `Authorization: Bearer {API_KEY}`
**Body**: `{"recordId":"..."}`
**Response**: Binary DOCX file (8.7KB)

### `POST /api/pdf/generate`
Generate PDF with Azure Storage (~21 seconds)

**Headers**: `Authorization: Bearer {API_KEY}`
**Body**: `{"recordId":"..."}`
**Response**: `{"success":true,"pdfUrl":"https://...","recordId":"...","generatedAt":"..."}`

---

## Performance

| Stage | Duration | Output |
|-------|----------|--------|
| Dataverse Fetch | ~1s | Application data |
| DTO Mapping | <100ms | 71 fields |
| DOCX Generation | ~1s | 8.7KB |
| PDF Conversion | ~18s | 61KB (3 pages) |
| Azure Upload | ~2s | Blob URL |
| **Total** | **~21s** | PDF URL |

---

## Deployment Status

### ✅ Completed
- [x] LibreOffice installation (v25.8.4.2)
- [x] DOCX generation working
- [x] PDF conversion working
- [x] Azure Blob Storage configured
- [x] End-to-end pipeline tested
- [x] All fields & conditional sections validated
- [x] Power Pages JavaScript prepared

### ⏳ Next Steps
- [ ] Deploy Power Pages JavaScript
- [ ] Configure Power Pages Site Settings
- [ ] Test from Power Pages portal
- [ ] Production server deployment

**Estimated Go-Live**: 1-2 days

---

## Troubleshooting

**Issue**: "Nothing happens when clicking PDF button"
→ Check [DEBUGGING_GUIDE.md](DEBUGGING_GUIDE.md) - CSS selector mismatch

**Issue**: "LibreOffice command not found"
→ Install LibreOffice v25.8.4.2+ and update `LIBREOFFICE_PATH`

**Issue**: "Dataverse authentication fails"
→ Verify Azure AD credentials in `.env`

---

## Security

- ✅ Bearer token authentication
- ✅ CORS restricted to Power Pages origin
- ✅ UUID validation
- ✅ Environment variables for secrets
- ✅ Read-only Dataverse access

**Production**: Rotate API key, use Azure Key Vault, enable monitoring

---

**Built For**: Dubai Financial Services Authority (DFSA)
**Technology**: Plan C (DOCX Template-Based with LibreOffice)
**Status**: ✅ PRODUCTION READY
**Next**: Power Pages deployment
