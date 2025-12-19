# DFSA PDF Generation - Current Status

**Date:** December 18, 2025
**Status:** Phase 1 Complete ✅ | Phase 2 In Progress 🔄 | Phase 3 Pending ⏳

---

## ✅ Completed Work

### Phase 1: API Endpoint Setup
**Status: COMPLETE**

The Express API server is fully operational and tested:

- **API Server:** Running on `http://localhost:3002` (dev) / Port 3002
- **Endpoints:**
  - `GET /health` - Health check (tested ✅)
  - `POST /api/pdf/generate` - PDF generation (tested ✅)
- **Authentication:** Bearer token with secure API key
- **CORS:** Configured for `https://dqdfsadev3.powerappsportals.com`

**Pipeline Test Results:**
1. ✅ API authentication validated
2. ✅ Dataverse record fetch (ID: `18036be5-dadb-f011-8544-6045bd69d7d8`)
3. ✅ DTO mapping completed (71 fields + 3 related entities)
4. ✅ DOCX template generated
5. ❌ PDF conversion blocked (Graph API issue - requires Phase 3)

**Files Created:**
- `src/api/server.ts` - Express application
- `src/api/routes/pdfRoutes.ts` - API routes
- `src/api/handlers/pdfHandlers.ts` - Request handlers
- `src/api/middleware/authMiddleware.ts` - Authentication
- `PHASE1_COMPLETION_SUMMARY.md` - Detailed documentation

**Configuration:**
- API Key: `baxyDK0I6I81XUAYm6V4q1zUU6y0bIDrZhBpm4VZG20=`
- Power Pages Origin: `https://dqdfsadev3.powerappsportals.com`

---

## 🔄 Current Work In Progress

### Phase 2: Power Pages Integration
**Status: IN PROGRESS**

**What User is Doing:**
- Adding API settings to Power Pages Site Settings
- Configuring secure storage for API endpoint and API key

**Identified Information:**

#### Record ID Location:
- **Source:** URL parameter
- **Example URL:** `https://dqdfsadev3.powerappsportals.com/profile/authorised-individual-form/?id=18036be5-dadb-f011-8544-6045bd69d7d8&stepid=56eb3a53-43b1-ef11-b8e8-0022480cfee0`
- **Extraction Method:** `new URLSearchParams(window.location.search).get('id')`

#### PDF Download Button:
- **Element:** `.pdf-btn` (custom button added via JavaScript)
- **Label:** "Download PDF"
- **Styling:** Brown background (#a29061), white text
- **Location:** Appended to `.actions .col-md-6` container
- **Current State:** Button exists but not connected to API

#### Existing Custom JavaScript:
Last step already includes:
- Stage progress indicator
- User type validation for Next button
- PDF download button UI (not functional yet)
- Uses `webapi.safeAjax` pattern for Dataverse calls

---

## ⏳ Next Steps to Complete Phase 2

### Step 1: Add Site Settings in Power Pages
**User Action Required:**

1. Go to Power Apps Portal Management
2. Navigate to **Site Settings**
3. Create two settings:

| Name | Value |
|------|-------|
| `PDF_API_Endpoint` | `http://localhost:3002/api/pdf/generate` (dev) |
| `PDF_API_Key` | `baxyDK0I6I81XUAYm6V4q1zUU6y0bIDrZhBpm4VZG20=` |

### Step 2: Add Liquid Template for Configuration
**Location:** Web Template or Page Template for Authorised Individual form

```liquid
<script>
    window.PDF_CONFIG = {
        apiEndpoint: "{{ settings['PDF_API_Endpoint'] }}",
        apiKey: "{{ settings['PDF_API_Key'] }}"
    };
</script>
```

### Step 3: Update Custom JavaScript
**Add to existing last step JavaScript:**

```javascript
// PDF Generation Integration
$(document).ready(function() {
    // Get record ID from URL
    function getRecordId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // Attach PDF generation to existing button
    $('.pdf-btn').on('click', function(e) {
        e.preventDefault();

        const recordId = getRecordId();

        if (!recordId) {
            alert("Error: Could not find application record. Please try again.");
            console.error("Record ID not found in URL");
            return;
        }

        const $button = $(this);
        const originalHtml = $button.html();

        // Show loading state
        $button.prop('disabled', true)
               .html('<i class="fa fa-spinner fa-spin"></i> Generating PDF...');

        // Call API
        fetch(window.PDF_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.PDF_CONFIG.apiKey}`
            },
            body: JSON.stringify({ recordId: recordId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update Dataverse record with PDF URL
                webapi.safeAjax({
                    type: "PATCH",
                    url: `/_api/dfsa_authorised_individuals(${recordId})`,
                    contentType: "application/json",
                    data: JSON.stringify({
                        "dfsa_pdf_url": data.pdfUrl,
                        "dfsa_pdf_generated_date": new Date().toISOString()
                    }),
                    success: function() {
                        alert("PDF generated successfully!");
                        // Open PDF in new tab
                        window.open(data.pdfUrl, '_blank');
                    },
                    error: function(error) {
                        console.error("Failed to update record:", error);
                        alert("PDF generated but failed to save URL. Please contact support.");
                    }
                });
            } else {
                throw new Error(data.error || 'PDF generation failed');
            }
        })
        .catch(error => {
            console.error('[PDF] Error:', error);
            alert(`Failed to generate PDF: ${error.message}`);
        })
        .finally(() => {
            // Restore button
            $button.prop('disabled', false).html(originalHtml);
        });
    });
});
```

### Step 4: Add Dataverse Fields (if not exist)
**User Action Required:**

1. Go to Power Apps → Tables → `dfsa_authorised_individual`
2. Add columns:
   - **dfsa_pdf_url** (Text, 500 chars)
   - **dfsa_pdf_generated_date** (Date and Time)

### Step 5: Testing Checklist

- [ ] Site Settings added and saved
- [ ] Liquid template added to page
- [ ] Custom JavaScript updated
- [ ] Dataverse fields created
- [ ] Navigate to last step of form
- [ ] Open browser DevTools (F12) → Console
- [ ] Verify `window.PDF_CONFIG` is defined
- [ ] Click "Download PDF" button
- [ ] Check Console for logs
- [ ] Check Network tab for API call
- [ ] Verify API returns expected error (PDF conversion failure)
- [ ] Confirm record ID matches URL parameter

---

## ⏳ Pending Work

### Phase 3: PDF Conversion Fix
**Status: BLOCKED - CRITICAL**

**Current Issue:** Graph API returns `/me request is only valid with delegated authentication flow`

**Two Options:**

#### Option A: LibreOffice (Quick POC)
- Install LibreOffice on local machine
- Set `PDF_CONVERSION_ENGINE=libreoffice` in `.env`
- **Pros:** Immediate testing capability
- **Cons:** Requires LibreOffice on server

#### Option B: Fix Graph API (Production)
- Create SharePoint site and document library
- Configure `GRAPH_SITE_ID` and `GRAPH_DRIVE_ID`
- Update conversion service code
- **Pros:** Cloud-native, scalable
- **Cons:** Requires SharePoint setup

**Recommendation:** Implement Option A first to enable end-to-end testing, then switch to Option B for production.

### Phase 4: Blob Storage (Pending Configuration)
- Verify `AZURE_STORAGE_CONNECTION_STRING` in `.env`
- Test PDF upload to Azure Blob Storage
- Verify public URL generation

### Phase 5: End-to-End Testing
- Complete flow from Power Pages to PDF download
- Test error scenarios
- Validate all conditional fields

### Phase 6: Production Deployment
- Deploy Express API to Azure Web App
- Update Power Pages Site Settings with production URLs
- Configure Azure environment variables
- Update CORS for production origin only

---

## 🎯 Immediate Priority

**Goal:** Complete Phase 2 Power Pages Integration

**Next Actions:**
1. User completes Site Settings configuration
2. Add Liquid template to page
3. Update Custom JavaScript with PDF generation code
4. Test button click → API call flow
5. Verify error handling (will fail at PDF conversion as expected)

**Expected Outcome:**
- Button triggers API call successfully
- Console shows complete request/response flow
- Error message displays PDF conversion failure (expected)
- Ready to proceed with Phase 3 (PDF conversion fix)

---

## 📋 Quick Reference

**API Endpoint (Dev):** `http://localhost:3002/api/pdf/generate`
**API Key:** `baxyDK0I6I81XUAYm6V4q1zUU6y0bIDrZhBpm4VZG20=`
**Test Record ID:** `18036be5-dadb-f011-8544-6045bd69d7d8`
**Power Pages URL:** `https://dqdfsadev3.powerappsportals.com`

**API Test Command:**
```bash
curl -X POST http://localhost:3002/api/pdf/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer baxyDK0I6I81XUAYm6V4q1zUU6y0bIDrZhBpm4VZG20=" \
  -d '{"recordId":"18036be5-dadb-f011-8544-6045bd69d7d8"}'
```

---

**Last Updated:** December 18, 2025
**Current Focus:** Power Pages Integration (Phase 2)
**Blocker:** PDF Conversion (Phase 3 required)
