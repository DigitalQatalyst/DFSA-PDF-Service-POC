# Pending Improvements & Tasks
## What We Can Complete While Waiting for Client Secret

**Last Updated**: 2025-12-17

---

## ✅ Already Completed

1. ✅ Service merge (POC + pdf-rendering-service)
2. ✅ All dependencies installed
3. ✅ TypeScript compilation successful (no errors)
4. ✅ Security hardening (CORS, token validation)
5. ✅ Complete mapper with 8 condition flags + 71 fields
6. ✅ Configuration validation script (`test:config`)
7. ✅ Comprehensive documentation (README, MERGE-SUMMARY, DEMO-GUIDE)

---

## 🔧 Quick Wins (Can Do Now - 30 minutes)

### 1. Create Sample/Mock Data File ⭐ HIGH VALUE
**Why**: Enables testing without Dataverse connection
**Benefit**: Can test mapper, template rendering, PDF generation independently

**Task**:
- Create `src/tests/mock-data.json` with realistic Authorised Individual data
- Update test scripts to support mock mode
- Enable template testing without Dataverse

**Files to Create/Modify**:
- `src/tests/mock-data.json` - Sample Dataverse response
- `src/tests/test-mapper-mock.ts` - Test mapper with mock data
- `src/tests/test-template-mock.ts` - Test template with mock data

**Value**: ⭐⭐⭐⭐⭐ (Unblocks template testing)

---

### 2. Add Request/Response Examples to API Documentation ⭐
**Why**: Makes API easier to understand and use
**Benefit**: Better developer experience

**Task**:
- Add curl examples to README
- Add Postman collection examples
- Add response schemas

**Files to Create/Modify**:
- `POSTMAN-COLLECTION.json` - Importable Postman collection
- Update `API-QUICK-REFERENCE.md` with more examples

**Value**: ⭐⭐⭐⭐ (Improves documentation)

---

### 3. Add Health Check Enhancements ⭐
**Why**: Better monitoring and diagnostics
**Benefit**: Easier to troubleshoot issues

**Task**:
- Add dependency health checks (Dataverse reachable, template exists, etc.)
- Add version information
- Add configuration status

**Files to Modify**:
- `src/index.ts` - Enhanced `/health` endpoint

**Value**: ⭐⭐⭐ (Better operations)

---

### 4. Create Template Placeholder Generator Script ⭐⭐⭐
**Why**: Helps template creators see all available fields
**Benefit**: Faster template creation

**Task**:
- Script that generates text file with ALL placeholders
- Organized by section
- Includes conditional syntax examples

**Files to Create**:
- `src/scripts/generate-template-placeholders.ts`
- Output: `TEMPLATE-PLACEHOLDERS.txt`

**Value**: ⭐⭐⭐⭐ (Speeds up template creation)

---

## 🎯 Medium Effort (30-60 minutes each)

### 5. Add API Rate Limiting ⭐⭐
**Why**: Prevent abuse, improve stability
**Benefit**: Production-ready security

**Task**:
- Implement express-rate-limit middleware
- Add per-endpoint limits
- Add IP-based throttling

**Files to Create/Modify**:
- `src/middleware/rate-limit.middleware.ts`
- `src/index.ts` - Apply middleware

**Value**: ⭐⭐⭐ (Security improvement)

---

### 6. Add Comprehensive Error Codes ⭐
**Why**: Easier API debugging
**Benefit**: Better error handling

**Task**:
- Define error code enum (DATAVERSE_001, TEMPLATE_002, etc.)
- Add error code to all error responses
- Create error code documentation

**Files to Create/Modify**:
- `src/types/errors.ts` - Error codes enum
- `src/utils/error-handler.ts` - Centralized error handler
- `ERROR-CODES.md` - Documentation

**Value**: ⭐⭐⭐ (Better DX)

---

### 7. Add Logging Improvements ⭐⭐
**Why**: Better debugging and monitoring
**Benefit**: Easier troubleshooting

**Task**:
- Add request correlation IDs to all logs
- Add performance timing logs
- Add structured logging (JSON format option)
- Add log levels per module

**Files to Modify**:
- `src/utils/logger.ts` - Enhanced logger
- `src/middleware/request.middleware.ts` - Add timing

**Value**: ⭐⭐⭐⭐ (Operations improvement)

---

### 8. Create Docker Configuration ⭐⭐⭐
**Why**: Easier deployment
**Benefit**: Containerized deployment ready

**Task**:
- Create Dockerfile
- Create docker-compose.yml
- Add .dockerignore
- Test build

**Files to Create**:
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `DOCKER.md` - Docker deployment guide

**Value**: ⭐⭐⭐⭐ (Deployment ready)

---

## 🚀 Larger Projects (1-2 hours each)

### 9. Add Swagger/OpenAPI Documentation ⭐⭐⭐
**Why**: Auto-generated API docs
**Benefit**: Interactive API documentation

**Task**:
- Add swagger-jsdoc
- Add swagger-ui-express
- Document all endpoints with JSDoc comments
- Add `/api-docs` endpoint

**Files to Create/Modify**:
- `src/config/swagger.ts` - Swagger configuration
- Add JSDoc comments to all controllers
- `package.json` - Add dependencies

**Value**: ⭐⭐⭐⭐⭐ (Professional API docs)

---

### 10. Add Automated Testing Suite ⭐⭐
**Why**: Quality assurance
**Benefit**: Confidence in changes

**Task**:
- Add Jest unit tests for mapper
- Add integration tests for API endpoints
- Add mock Dataverse responses
- Add CI/CD test runner configuration

**Files to Create**:
- `src/tests/unit/mapper.test.ts`
- `src/tests/integration/api.test.ts`
- `src/tests/mocks/dataverse.mock.ts`
- `jest.config.js`

**Value**: ⭐⭐⭐⭐ (Quality improvement)

---

### 11. Add Admin Dashboard/Monitoring ⭐
**Why**: Operational visibility
**Benefit**: Monitor service health

**Task**:
- Create `/admin` routes
- Add stats endpoint (requests, errors, response times)
- Add recent requests log
- Add configuration viewer

**Files to Create**:
- `src/routes/adminRoutes.ts`
- `src/controllers/adminController.ts`
- `src/utils/metrics.ts`

**Value**: ⭐⭐⭐ (Operations tool)

---

### 12. Add Webhook Support for Async PDF Generation ⭐⭐
**Why**: Handle long-running PDF generation
**Benefit**: Better UX for slow conversions

**Task**:
- Add job queue (in-memory or Redis)
- Add webhook URL to PDF generation request
- Call webhook when PDF ready
- Add job status endpoint

**Files to Create/Modify**:
- `src/services/queue/jobQueue.ts`
- `src/services/webhook/webhookService.ts`
- `src/controllers/pdfController.ts` - Add async mode

**Value**: ⭐⭐⭐ (Scalability)

---

## 📚 Documentation Improvements

### 13. Add Architecture Decision Records (ADRs) ⭐
**Why**: Document design decisions
**Benefit**: Future maintainers understand why

**Files to Create**:
- `docs/adr/001-express-over-azure-functions.md`
- `docs/adr/002-docxtemplater-for-templates.md`
- `docs/adr/003-conditional-flags-strategy.md`

**Value**: ⭐⭐ (Knowledge preservation)

---

### 14. Add Video Walkthrough Script ⭐⭐
**Why**: Training material
**Benefit**: Onboard new developers faster

**Files to Create**:
- `WALKTHROUGH-SCRIPT.md` - Step-by-step demo script
- Screen recording guide
- Key talking points

**Value**: ⭐⭐⭐ (Training)

---

### 15. Add Troubleshooting Playbook ⭐⭐
**Why**: Common issues + solutions
**Benefit**: Faster problem resolution

**Files to Create**:
- `TROUBLESHOOTING.md` - Common issues
- Include error codes, symptoms, fixes
- Add debugging tips

**Value**: ⭐⭐⭐ (Support tool)

---

## 🎨 Template & PDF Improvements

### 16. Create Sample Template (Partial) ⭐⭐⭐⭐⭐
**Why**: Show what template should look like
**Benefit**: Template creators have reference

**Task**:
- Create partial Word template with key sections
- Add placeholder examples
- Add conditional section examples
- Add repeating table examples

**Files to Create**:
- `src/templates/AuthorisedIndividual/SAMPLE-PARTIAL.docx`
- Update README with sample info

**Value**: ⭐⭐⭐⭐⭐ (Critical for template creation)

---

### 17. Add PDF Metadata Injection ⭐
**Why**: Better PDF properties
**Benefit**: Professional PDFs

**Task**:
- Add title, author, subject to generated PDFs
- Add creation date
- Add custom metadata (applicationId, version)

**Files to Modify**:
- PDF conversion services (both Graph and LibreOffice)

**Value**: ⭐⭐ (Polish)

---

### 18. Add PDF Watermark Support ⭐
**Why**: Mark draft vs final documents
**Benefit**: Visual distinction

**Task**:
- Add watermark option to PDF generation
- Support "DRAFT", "CONFIDENTIAL", etc.
- Make configurable per request

**Files to Modify**:
- PDF conversion services

**Value**: ⭐⭐ (Feature enhancement)

---

## 🔒 Security Improvements

### 19. Add API Key Authentication (Alternative to Azure AD) ⭐⭐
**Why**: Simpler auth for server-to-server
**Benefit**: Easier integration for some clients

**Task**:
- Add API key generation
- Add API key validation middleware
- Add key management endpoints

**Files to Create**:
- `src/middleware/apikey.middleware.ts`
- `src/services/auth/apiKeyService.ts`

**Value**: ⭐⭐⭐ (Flexibility)

---

### 20. Add Audit Logging ⭐⭐⭐
**Why**: Compliance and security
**Benefit**: Track who did what when

**Task**:
- Log all PDF generation requests
- Log all data access
- Store audit logs (file or database)
- Add audit log query endpoint

**Files to Create**:
- `src/services/audit/auditLogger.ts`
- `src/routes/auditRoutes.ts`

**Value**: ⭐⭐⭐⭐ (Compliance)

---

## 🎯 Recommended Priority Order (While Waiting)

### Phase 1: Immediate (Do These First) ⏰ 1-2 hours
1. **Create Mock Data File** (#1) - Unblocks testing ⭐⭐⭐⭐⭐
2. **Create Sample Template** (#16) - Shows template structure ⭐⭐⭐⭐⭐
3. **Template Placeholder Generator** (#4) - Helps template creation ⭐⭐⭐⭐
4. **Health Check Enhancements** (#3) - Better diagnostics ⭐⭐⭐

**Why These**: Unblock template creation and testing without Dataverse

---

### Phase 2: Short-term (Next 2-3 hours)
5. **Add Swagger/OpenAPI** (#9) - Professional API docs ⭐⭐⭐⭐⭐
6. **Docker Configuration** (#8) - Deployment ready ⭐⭐⭐⭐
7. **Logging Improvements** (#7) - Better debugging ⭐⭐⭐⭐
8. **API Examples & Postman** (#2) - Better DX ⭐⭐⭐⭐

**Why These**: Improve documentation and deployment readiness

---

### Phase 3: When Client Secret Arrives
9. Test with real Dataverse data
10. Validate all endpoints
11. Complete template with real data
12. Run full test suite

---

### Phase 4: Production Hardening (Later)
13. Rate Limiting (#5)
14. Error Codes (#6)
15. Audit Logging (#20)
16. Automated Tests (#10)

---

## 💡 Quick Decision Matrix

| Task | Value | Effort | Priority | Blocks Template? |
|------|-------|--------|----------|-----------------|
| Mock Data | ⭐⭐⭐⭐⭐ | 30min | **DO NOW** | Yes |
| Sample Template | ⭐⭐⭐⭐⭐ | 45min | **DO NOW** | Yes |
| Placeholder Generator | ⭐⭐⭐⭐ | 20min | **DO NOW** | Yes |
| Health Check | ⭐⭐⭐ | 15min | **DO NOW** | No |
| Swagger Docs | ⭐⭐⭐⭐⭐ | 90min | Do Soon | No |
| Docker | ⭐⭐⭐⭐ | 60min | Do Soon | No |
| Logging | ⭐⭐⭐⭐ | 45min | Do Soon | No |
| Rate Limiting | ⭐⭐⭐ | 30min | Later | No |
| Error Codes | ⭐⭐⭐ | 45min | Later | No |
| Audit Logging | ⭐⭐⭐⭐ | 90min | Later | No |

---

## 🚀 Let's Start Now!

### Recommended First Task: Create Mock Data
**Time**: 30 minutes
**Value**: Unblocks template testing immediately

Would you like me to:
1. **Create mock data file** with realistic Authorised Individual data?
2. **Create sample/partial DOCX template** showing structure?
3. **Generate placeholder list** for template creators?
4. **Add Swagger/OpenAPI documentation**?
5. **Set up Docker configuration**?

**Or all of the above in order of priority?**

---

## Summary

**Total Pending Items**: 20 improvements identified
**High Priority**: 4 items (Mock data, Sample template, Placeholders, Health check)
**Can Complete Before Client Secret**: ~15 items
**Estimated Time for High Priority**: 2 hours
**Estimated Time for All**: 10-15 hours

**Recommended Action**: Start with Phase 1 (4 items, 2 hours) to maximize template creation readiness.
