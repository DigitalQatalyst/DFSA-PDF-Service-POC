# API Quick Reference

## Base URL
```
http://localhost:3001
```

## Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-17T10:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "dataverseUrl": "https://your-org.crm.dynamics.com"
}
```

---

### 2. List Records
```http
GET /api/v1/authorised-individual/list
```

**Purpose:** Find test record IDs

**Response:**
```json
{
  "success": true,
  "count": 5,
  "records": [
    {
      "id": "12345678-abcd-efgh-ijkl-1234567890ab",
      "name": "John Doe",
      "firmName": "Example Firm Ltd",
      "createdOn": "2025-01-15T10:00:00Z"
    }
  ],
  "message": "Use one of these IDs to test GET /api/v1/authorised-individual/:id"
}
```

---

### 3. Get Mapped Record (Main POC Endpoint)
```http
GET /api/v1/authorised-individual/:id
```

**Example:**
```bash
curl http://localhost:3001/api/v1/authorised-individual/12345678-abcd-efgh-ijkl-1234567890ab
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Guidelines": {
      "ConfirmRead": "I confirm"
    },
    "DIFCDisclosure": {
      "ConsentToDisclosure": true
    },
    "Application": {
      "Id": "12345678-abcd-efgh-ijkl-1234567890ab",
      "FirmName": "Example Firm Ltd",
      "FirmNumber": "FIRM-001",
      "Requestor": {
        "Name": "Jane Smith",
        "Position": "Manager",
        "Email": "jane@example.com",
        "Phone": "+971501234567"
      },
      "AuthorisedIndividualName": "John Doe",
      "Contact": {
        "Address": "123 Main St, Dubai",
        "PostCode": "12345",
        "Country": "United Arab Emirates",
        "Mobile": "+971501234568",
        "Email": "john@example.com",
        "ResidenceDuration": "3 years or more"
      },
      "PreviousAddress": null,
      "OtherNames": {
        "StateOtherNames": "John Smith",
        "NativeName": "جون دو",
        "DateChanged": "2010-05-15",
        "Reason": "Marriage"
      }
    },
    "Flags": {
      "RepOffice": false,
      "PreviouslyHeld": false,
      "OtherNames": true,
      "ResidenceDurationLessThan3Years": false,
      "HasStartDate": true,
      "HasRegulatoryHistory": true,
      "LicensedFunctionSelected": true
    },
    "LicensedFunctions": {
      "ShowLicensedFunctionsSection": true,
      "ShowMandatoryFunctionsQuestion": true,
      "LicensedFunctionChoice": "LicensedDirector",
      "LicensedFunctionChoiceLabel": "Licensed Director",
      "SeniorExecutiveOfficer": false,
      "FinanceOfficer": false,
      "ComplianceOfficer": true,
      "MLRO": true,
      "NoMandatoryFunction": false,
      "ShowResponsibleOfficerConfirmations": false
    },
    "PassportDetails": [
      {
        "Title": "Mr",
        "FullName": "John Doe",
        "DateOfBirth": "1985-05-20",
        "PlaceOfBirth": "London, UK",
        "UaeResident": false,
        "NumberOfCitizenships": "1",
        "OtherNames": "",
        "NativeName": ""
      }
    ],
    "Citizenships": [
      {
        "Country": "United Kingdom",
        "PassportNo": "123456789",
        "ExpiryDate": "2030-12-31"
      }
    ],
    "RegulatoryHistory": [
      {
        "Regulator": "FCA (UK)",
        "DateStarted": "2010-01-01",
        "DateFinished": null,
        "LicenseName": "FCA Approved Person",
        "RegisterName": "FCA Register",
        "Overview": "Compliance and MLRO functions",
        "IsOtherRegulator": false,
        "OtherRegulatorDetails": null
      }
    ],
    "Position": {
      "ProposedJobTitle": "Chief Compliance Officer",
      "HasProposedStartDate": true,
      "ProposedStartDate": "2025-02-01",
      "StartDateExplanation": null,
      "WillBeMLRO": true
    },
    "GeneratedAt": "2025-12-17T10:00:00.000Z",
    "TemplateVersion": "1.0"
  },
  "metadata": {
    "recordId": "12345678-abcd-efgh-ijkl-1234567890ab",
    "fetchedAt": "2025-12-17T10:00:00.000Z",
    "conditionalSections": {
      "showPreviousAddress": false,
      "showOtherNames": true,
      "showLicensedFunctions": true,
      "showRegulatoryHistory": true
    },
    "repeatingSections": {
      "passportDetailsCount": 1,
      "citizenshipsCount": 1,
      "regulatoryHistoryCount": 1
    }
  }
}
```

---

### 4. Conditional Logic Demo
```http
GET /api/v1/authorised-individual/:id/conditional-demo
```

**Purpose:** Show WHY sections are visible/hidden

**Example:**
```bash
curl http://localhost:3001/api/v1/authorised-individual/12345678-abcd-efgh-ijkl-1234567890ab/conditional-demo
```

**Response:**
```json
{
  "success": true,
  "message": "Conditional logic demonstration",
  "explanation": {
    "flags": {
      "RepOffice": false,
      "OtherNames": true,
      "ResidenceDurationLessThan3Years": false,
      "HasRegulatoryHistory": true
    },
    "sections": [
      {
        "sectionCode": "AUTH_PREV_ADDRESS",
        "sectionName": "Previous Address",
        "visible": false,
        "reason": "Candidate has lived at current address for 3 years or more",
        "dataverseValue": 612320001,
        "dataverseField": "cr5f7_howlonghasthecandidateresidedattheabov",
        "expectedValue": 612320000,
        "actualData": null
      },
      {
        "sectionCode": "AUTH_OTHER_NAMES",
        "sectionName": "Other Names",
        "visible": true,
        "reason": "Candidate has used other names or changed names",
        "dataverseValue": true,
        "dataverseField": "dfsa_hasthecandidateeverusedothernamesorchanged",
        "expectedValue": true,
        "actualData": {
          "StateOtherNames": "John Smith",
          "NativeName": "جون دو",
          "DateChanged": "2010-05-15",
          "Reason": "Marriage"
        }
      },
      {
        "sectionCode": "AUTH_LIC_FUNC",
        "sectionName": "Licensed Functions",
        "visible": true,
        "reason": "SHOWN: Candidate is not applying for Representative Office",
        "dataverseValue": false,
        "dataverseField": "dfsa_ai_isthecandidateapplyingonbehalfofarepres",
        "expectedValue": false,
        "actualData": {
          "ShowLicensedFunctionsSection": true,
          "LicensedFunctionChoice": "LicensedDirector"
        }
      }
    ],
    "repeatingSections": {
      "passportDetails": {
        "count": 1,
        "records": [
          {
            "FullName": "John Doe",
            "DateOfBirth": "1985-05-20"
          }
        ]
      },
      "regulatoryHistory": {
        "count": 1,
        "records": [
          {
            "Regulator": "FCA (UK)",
            "DateStarted": "2010-01-01"
          }
        ],
        "note": "Only populated if HasRegulatoryHistory flag = true"
      }
    }
  }
}
```

---

## Testing with curl

### Get list of records
```bash
curl http://localhost:3001/api/v1/authorised-individual/list
```

### Get specific record (replace with actual ID)
```bash
curl http://localhost:3001/api/v1/authorised-individual/YOUR-GUID-HERE
```

### Get conditional demo
```bash
curl http://localhost:3001/api/v1/authorised-individual/YOUR-GUID-HERE/conditional-demo
```

---

## Testing with Postman

1. Import collection:
   - Create new collection "DFSA PDF Service"
   - Add requests for each endpoint above

2. Set base URL variable:
   - Variable: `baseUrl`
   - Value: `http://localhost:3001`

3. Test sequence:
   - Health check → Verify server is running
   - List → Get test record ID
   - Get record → Verify mapping works
   - Conditional demo → Understand logic

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid ID format. Expected GUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Authorised Individual record not found: 12345678-..."
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Failed to authenticate with Dataverse. Check credentials."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to fetch Authorised Individual data"
}
```

---

## Next Steps

After testing these endpoints:

1. **Verify conditional logic** - Use `/conditional-demo` to understand WHY sections appear
2. **Test with different records** - Records with different flag values will show different sections
3. **Ready for PDF generation** - The DTO structure is ready to be passed to DOCX template

---

**Need help?** See [README.md](README.md) for detailed documentation or [SETUP.md](SETUP.md) for troubleshooting.
