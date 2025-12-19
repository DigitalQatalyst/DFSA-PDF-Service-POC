# PDF Generation Service - Implementation Plan

## Phase 1: API Endpoint Setup (Week 1)

### 1.1 Express API Server Setup

**Files to Create:**
- `src/api/server.ts` - Main Express server
- `src/api/routes/pdfRoutes.ts` - PDF generation endpoints
- `src/api/middleware/authMiddleware.ts` - Request authentication
- `src/api/middleware/errorHandler.ts` - Centralized error handling

**Implementation:**

```typescript
// src/api/server.ts
import express from 'express';
import cors from 'cors';
import pdfRoutes from './routes/pdfRoutes';
import { errorHandler } from './middleware/errorHandler';
import { validateEnv } from '../config/env';
import logger from '../utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.POWER_PAGES_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/pdf', pdfRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
validateEnv();
app.listen(PORT, () => {
  logger.info(`PDF Generation Service running on port ${PORT}`);
});

export default app;
```

```typescript
// src/api/routes/pdfRoutes.ts
import express from 'express';
import { generatePdfHandler, getPdfStatusHandler } from '../handlers/pdfHandlers';
import { authenticateRequest } from '../middleware/authMiddleware';

const router = express.Router();

// POST /api/pdf/generate
// Body: { applicationId: string, documentType: string }
router.post('/generate', authenticateRequest, generatePdfHandler);

// GET /api/pdf/status/:jobId
router.get('/status/:jobId', authenticateRequest, getPdfStatusHandler);

export default router;
```

**Environment Variables to Add:**
```env
# API Configuration
PORT=3000
POWER_PAGES_ORIGIN=https://dqdfsadev3.powerappsportals.com
API_KEY=<secure-api-key>

# PDF Storage
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
AZURE_STORAGE_CONTAINER=dfsa-pdfs
```

**Testing:**
```bash
# Start server
npm run dev

# Test endpoint
curl -X POST http://localhost:3000/api/pdf/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"applicationId": "18036be5-dadb-f011-8544-6045bd69d7d8", "documentType": "AuthorisedIndividual"}'
```

---

### 1.2 PDF Generation Handler

**File:** `src/api/handlers/pdfHandlers.ts`

```typescript
import { Request, Response } from 'express';
import { generatePdf } from '../../services/pdf/pdfService';
import logger from '../../utils/logger';

export async function generatePdfHandler(req: Request, res: Response) {
  const { applicationId, documentType } = req.body;

  // Validation
  if (!applicationId || !documentType) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['applicationId', 'documentType']
    });
  }

  try {
    logger.info('PDF generation requested', { applicationId, documentType });

    // Start async PDF generation
    const result = await generatePdf({
      applicationId,
      documentType,
      templateVersion: '1.0'
    });

    return res.status(200).json({
      success: true,
      pdfUrl: result.pdfUrl,
      documentId: result.documentId,
      generatedAt: result.generatedAt
    });

  } catch (error) {
    logger.error('PDF generation failed', {
      applicationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return res.status(500).json({
      success: false,
      error: 'PDF generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getPdfStatusHandler(req: Request, res: Response) {
  const { jobId } = req.params;

  // TODO: Implement job status tracking
  return res.status(200).json({
    jobId,
    status: 'completed',
    pdfUrl: 'https://storage.example.com/pdfs/...'
  });
}
```

**Dependencies to Install:**
```bash
npm install express cors
npm install --save-dev @types/express @types/cors
```

---

### 1.3 Authentication Middleware

**File:** `src/api/middleware/authMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';

export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('Missing API key in request', { path: req.path });
    return res.status(401).json({ error: 'API key required' });
  }

  if (apiKey !== process.env.API_KEY) {
    logger.warn('Invalid API key', { path: req.path });
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}
```

---

## Phase 2: Power Pages Integration (Week 1-2)

### 2.1 Power Pages Form Enhancement

**Goal:** Add "Generate PDF" button to the final step of multi-step form

**Implementation Location:** Power Pages Portal Management

#### Step 2.1.1: Add Button to Form
1. Navigate to: Portal Management → Web Pages → Authorised Individual Form (final step)
2. Add HTML/JavaScript web template or code component

**JavaScript Code:**

```javascript
// Power Pages: Authorised Individual Form - Generate PDF Button
(function() {
  'use strict';

  // Configuration
  const API_ENDPOINT = 'https://your-api.azurewebsites.net/api/pdf/generate';
  const API_KEY = '{{ settings["PDF_API_KEY"] }}'; // Store in Site Settings

  // Add Generate PDF button after form submit
  function addGeneratePdfButton() {
    const formActions = document.querySelector('.form-actions');
    if (!formActions) return;

    const generateBtn = document.createElement('button');
    generateBtn.id = 'generate-pdf-btn';
    generateBtn.className = 'btn btn-primary';
    generateBtn.innerHTML = '<i class="fa fa-file-pdf-o"></i> Generate PDF';
    generateBtn.type = 'button';

    generateBtn.addEventListener('click', handleGeneratePdf);
    formActions.appendChild(generateBtn);
  }

  async function handleGeneratePdf() {
    const btn = document.getElementById('generate-pdf-btn');
    const applicationId = getApplicationId();

    if (!applicationId) {
      showError('Unable to retrieve application ID');
      return;
    }

    // Disable button and show loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating PDF...';

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          applicationId: applicationId,
          documentType: 'AuthorisedIndividual'
        })
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('PDF generated successfully!');
        // Update Dataverse record with PDF URL
        await updateRecordWithPdfUrl(applicationId, result.pdfUrl);
        // Optionally download PDF
        window.open(result.pdfUrl, '_blank');
      } else {
        showError('PDF generation failed: ' + result.message);
      }

    } catch (error) {
      console.error('PDF generation error:', error);
      showError('An error occurred while generating the PDF');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-file-pdf-o"></i> Generate PDF';
    }
  }

  function getApplicationId() {
    // Get from URL parameter or hidden field
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') ||
           document.getElementById('applicationId')?.value;
  }

  async function updateRecordWithPdfUrl(applicationId, pdfUrl) {
    // Use Dataverse Web API to update record
    const entityName = 'dfsa_authorised_individuals';
    const updateData = {
      dfsa_pdf_document_url: pdfUrl,
      dfsa_pdf_generated_date: new Date().toISOString()
    };

    try {
      await webapi.safeAjax({
        type: 'PATCH',
        url: `/_api/${entityName}(${applicationId})`,
        contentType: 'application/json',
        data: JSON.stringify(updateData)
      });
    } catch (error) {
      console.error('Failed to update record with PDF URL:', error);
    }
  }

  function showSuccess(message) {
    // Use Power Pages notification system
    const alert = `<div class="alert alert-success alert-dismissible" role="alert">
      <button type="button" class="close" data-dismiss="alert">×</button>
      ${message}
    </div>`;
    document.querySelector('.form-container').insertAdjacentHTML('beforebegin', alert);
  }

  function showError(message) {
    const alert = `<div class="alert alert-danger alert-dismissible" role="alert">
      <button type="button" class="close" data-dismiss="alert">×</button>
      ${message}
    </div>`;
    document.querySelector('.form-container').insertAdjacentHTML('beforebegin', alert);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addGeneratePdfButton);
  } else {
    addGeneratePdfButton();
  }

})();
```

#### Step 2.1.2: Configure CORS in API
Ensure your API server allows requests from Power Pages origin:

```typescript
// src/api/server.ts
app.use(cors({
  origin: 'https://dqdfsadev3.powerappsportals.com',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));
```

#### Step 2.1.3: Store API Key in Power Pages Site Settings
1. Portal Management → Site Settings → Create New
   - Name: `PDF_API_KEY`
   - Value: `<your-secure-api-key>`

---

### 2.2 Dataverse Schema Updates

**Required New Fields on `dfsa_authorised_individual` entity:**

```
Field Name: dfsa_pdf_document_url
Type: Text (Single Line)
Max Length: 500
Description: URL of generated PDF in blob storage

Field Name: dfsa_pdf_generated_date
Type: Date and Time
Description: Timestamp when PDF was generated

Field Name: dfsa_pdf_generation_status
Type: Choice (Option Set)
Options:
  - Not Generated (0)
  - In Progress (1)
  - Completed (2)
  - Failed (3)
```

**To Add Fields:**
1. Power Apps → Solutions → DFSA Solution
2. Tables → dfsa_authorised_individual → Columns → New Column
3. Configure each field as specified above
4. Publish customizations

---

## Phase 3: PDF Conversion Fix (Week 2)

### 3.1 Option A: LibreOffice (Recommended for POC)

**Advantages:**
- No additional Azure costs
- Works locally and on VM
- Simple setup

**Installation:**

**Windows:**
```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install LibreOffice
choco install libreoffice
```

**Linux (Azure VM):**
```bash
sudo apt-get update
sudo apt-get install -y libreoffice
```

**Update Environment:**
```env
# .env
PDF_CONVERSION_ENGINE=libreoffice
```

**Test:**
```bash
npm run test:pdf
```

---

### 3.2 Option B: Fix Microsoft Graph API (Enterprise Production)

**Issue:** Current error indicates using client credentials flow with `/me` endpoint

**Required Changes:**

#### Update Graph Client Configuration

**File:** `src/services/pdf/graphPdfConverter.ts`

```typescript
// Current issue: Using /me with app-only authentication
// Fix: Use SharePoint site or dedicated user drive

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

export async function convertDocxToPdfGraph(docxBuffer: Buffer): Promise<Buffer> {
  // Use app credentials
  const credential = new ClientSecretCredential(
    process.env.GRAPH_TENANT_ID!,
    process.env.GRAPH_CLIENT_ID!,
    process.env.GRAPH_CLIENT_SECRET!
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default']
  });

  const client = Client.initWithMiddleware({ authProvider });

  // CHANGE: Use SharePoint site instead of /me
  const siteId = process.env.GRAPH_SITE_ID; // e.g., 'contoso.sharepoint.com,abc123,def456'
  const driveId = process.env.GRAPH_DRIVE_ID; // Get from SharePoint site

  // Upload DOCX
  const fileName = `temp-${Date.now()}.docx`;
  const uploadResponse = await client
    .api(`/sites/${siteId}/drives/${driveId}/root:/${fileName}:/content`)
    .put(docxBuffer);

  const itemId = uploadResponse.id;

  // Convert to PDF
  const pdfStream = await client
    .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}/content?format=pdf`)
    .getStream();

  // Collect stream into buffer
  const chunks: Buffer[] = [];
  for await (const chunk of pdfStream) {
    chunks.push(chunk);
  }
  const pdfBuffer = Buffer.concat(chunks);

  // Delete temp file
  await client
    .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}`)
    .delete();

  return pdfBuffer;
}
```

**Additional Environment Variables:**
```env
# Microsoft Graph Configuration
GRAPH_TENANT_ID=<your-tenant-id>
GRAPH_CLIENT_ID=<your-app-id>
GRAPH_CLIENT_SECRET=<your-secret>
GRAPH_SITE_ID=<sharepoint-site-id>
GRAPH_DRIVE_ID=<document-library-drive-id>
```

**App Registration Permissions Required:**
- `Sites.ReadWrite.All` (Application)
- `Files.ReadWrite.All` (Application)

**To Get Site ID and Drive ID:**
```bash
# Get Site ID
curl -H "Authorization: Bearer <token>" \
  "https://graph.microsoft.com/v1.0/sites/root:/sites/YourSiteName"

# Get Drive ID
curl -H "Authorization: Bearer <token>" \
  "https://graph.microsoft.com/v1.0/sites/<site-id>/drives"
```

---

## Phase 4: Blob Storage Integration (Week 2)

### 4.1 Azure Blob Storage Setup

**Current Status:** Storage service exists but needs configuration

**File:** `src/services/storage/storageService.ts` (already exists)

**Verify Configuration:**
```typescript
// Should already work with correct connection string
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER || 'dfsa-pdfs';
```

**Create Container:**
```bash
# Using Azure CLI
az storage container create \
  --name dfsa-pdfs \
  --connection-string "<your-connection-string>" \
  --public-access blob
```

**Or via Azure Portal:**
1. Navigate to Storage Account
2. Containers → + Container
3. Name: `dfsa-pdfs`
4. Public access level: Blob (anonymous read access for blobs)

**Test Storage:**
```bash
# Add to .env
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=..."
AZURE_STORAGE_CONTAINER=dfsa-pdfs

# Run test
npm run test:pdf
```

---

## Phase 5: End-to-End Testing (Week 3)

### 5.1 Integration Test Checklist

**Test Scenario 1: Complete Flow from Power Pages**

```markdown
1. [ ] Open Power Pages form
2. [ ] Complete all steps (0.1, 0.2, 0.3, 1.1)
3. [ ] Click "Generate PDF" button
4. [ ] Verify:
   - [ ] Button shows loading state
   - [ ] API endpoint receives request
   - [ ] Dataverse record fetched successfully
   - [ ] DTO mapping completes with all fields
   - [ ] DOCX generated (8-9 KB)
   - [ ] PDF conversion succeeds
   - [ ] PDF stored in blob storage
   - [ ] PDF URL returned to Power Pages
   - [ ] Dataverse record updated with PDF URL
   - [ ] Success message shown
   - [ ] PDF opens in new tab
```

**Test Scenario 2: Error Handling**

```markdown
1. [ ] Invalid Application ID
   - Expected: 404 error, user-friendly message
2. [ ] Missing required Dataverse fields
   - Expected: Graceful degradation, empty values
3. [ ] PDF conversion fails
   - Expected: Retry logic or fallback
4. [ ] Storage upload fails
   - Expected: Error logged, user notified
5. [ ] Concurrent requests
   - Expected: All succeed independently
```

---

## Phase 6: Deployment (Week 3-4)

### 6.1 Azure Deployment Options

**Option A: Azure Web App (Recommended)**

```bash
# Create resource group
az group create --name dfsa-pdf-service-rg --location eastus

# Create App Service Plan
az appservice plan create \
  --name dfsa-pdf-service-plan \
  --resource-group dfsa-pdf-service-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group dfsa-pdf-service-rg \
  --plan dfsa-pdf-service-plan \
  --name dfsa-pdf-service \
  --runtime "NODE:18-lts"

# Deploy from GitHub (recommended)
az webapp deployment source config \
  --name dfsa-pdf-service \
  --resource-group dfsa-pdf-service-rg \
  --repo-url https://github.com/your-org/dfsa-pdf-service \
  --branch main \
  --manual-integration
```

**Configure Environment Variables:**
```bash
az webapp config appsettings set \
  --resource-group dfsa-pdf-service-rg \
  --name dfsa-pdf-service \
  --settings \
    DATAVERSE_URL="https://dfsaprimarydev.crm15.dynamics.com" \
    AZURE_TENANT_ID="..." \
    AZURE_CLIENT_ID="..." \
    AZURE_CLIENT_SECRET="@Microsoft.KeyVault(SecretUri=...)" \
    AZURE_STORAGE_CONNECTION_STRING="@Microsoft.KeyVault(SecretUri=...)" \
    PDF_CONVERSION_ENGINE="libreoffice" \
    API_KEY="@Microsoft.KeyVault(SecretUri=...)"
```

**Option B: Azure Container Instance (Simpler for POC)**

```bash
# Build Docker image
docker build -t dfsa-pdf-service .

# Push to Azure Container Registry
az acr create --resource-group dfsa-pdf-service-rg --name dfsaregistry --sku Basic
az acr login --name dfsaregistry
docker tag dfsa-pdf-service dfsaregistry.azurecr.io/dfsa-pdf-service:v1
docker push dfsaregistry.azurecr.io/dfsa-pdf-service:v1

# Deploy container
az container create \
  --resource-group dfsa-pdf-service-rg \
  --name dfsa-pdf-service \
  --image dfsaregistry.azurecr.io/dfsa-pdf-service:v1 \
  --dns-name-label dfsa-pdf-service \
  --ports 3000 \
  --environment-variables KEY=value
```

---

### 6.2 Dockerfile

**File:** `Dockerfile`

```dockerfile
FROM node:18-slim

# Install LibreOffice for PDF conversion
RUN apt-get update && \
    apt-get install -y libreoffice && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY dist ./dist
COPY src/templates ./src/templates

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["node", "dist/api/server.js"]
```

---

## Implementation Timeline

### Week 1: Foundation
- **Days 1-2:** Phase 1.1-1.3 (API Endpoint Setup)
- **Days 3-4:** Phase 2.1 (Power Pages Integration)
- **Day 5:** Phase 2.2 (Dataverse Schema Updates)

### Week 2: PDF & Storage
- **Days 1-2:** Phase 3 (PDF Conversion Fix - choose Option A or B)
- **Days 3-4:** Phase 4 (Blob Storage Integration)
- **Day 5:** Initial integration testing

### Week 3: Testing & Polish
- **Days 1-3:** Phase 5 (End-to-End Testing)
- **Days 4-5:** Bug fixes and refinements

### Week 4: Deployment
- **Days 1-2:** Phase 6.1 (Azure Deployment)
- **Days 3-4:** Production testing
- **Day 5:** Documentation and handoff

---

## Success Criteria

### Phase 1 Success Metrics
- [ ] API endpoint responds to POST requests
- [ ] Authentication working (API key validation)
- [ ] Error handling returns proper HTTP status codes
- [ ] Logging captures all requests

### Phase 2 Success Metrics
- [ ] "Generate PDF" button appears on Power Pages form
- [ ] Button successfully calls API endpoint
- [ ] Dataverse record updates with PDF URL
- [ ] User sees success/error messages

### Phase 3 Success Metrics
- [ ] DOCX converts to PDF without errors
- [ ] PDF file size is reasonable (< 1MB for typical form)
- [ ] PDF matches DOCX content exactly

### Phase 4 Success Metrics
- [ ] PDFs upload to blob storage
- [ ] URLs are accessible and downloadable
- [ ] Old PDFs are retained (no accidental deletion)

### End-to-End Success Criteria
- [ ] User can trigger PDF generation from Power Pages
- [ ] PDF generates in < 10 seconds for typical form
- [ ] 99%+ success rate (excluding network failures)
- [ ] All conditional fields render correctly in PDF
- [ ] All picklist values resolve to human-readable labels
- [ ] PDFs are accessible via URL for 90+ days

---

## Next Immediate Steps

1. **Choose PDF Conversion Approach:**
   - Option A (LibreOffice): Faster to implement, good for POC
   - Option B (Graph API): More enterprise-ready, requires SharePoint setup

2. **Set Up Development Environment:**
   ```bash
   # Install dependencies for API
   npm install express cors
   npm install --save-dev @types/express @types/cors nodemon

   # Update package.json scripts
   npm pkg set scripts.dev="nodemon --watch src --exec ts-node src/api/server.ts"
   ```

3. **Create API Endpoint (Start with Phase 1.1):**
   - Create `src/api/server.ts`
   - Create `src/api/routes/pdfRoutes.ts`
   - Test with curl or Postman

4. **Configure Power Pages:**
   - Add "Generate PDF" button to final form step
   - Store API key in Site Settings
   - Test button click triggers API call

Would you like me to start implementing Phase 1.1 (API Endpoint Setup) now?
