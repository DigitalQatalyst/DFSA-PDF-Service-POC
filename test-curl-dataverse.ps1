# PowerShell script to test Dataverse connection via curl
# Usage: .\test-curl-dataverse.ps1

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Dataverse API cURL Test" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create .env file with:" -ForegroundColor Yellow
    Write-Host "   - AZURE_TENANT_ID" -ForegroundColor Yellow
    Write-Host "   - AZURE_CLIENT_ID" -ForegroundColor Yellow
    Write-Host "   - AZURE_CLIENT_SECRET" -ForegroundColor Yellow
    Write-Host "   - DATAVERSE_URL" -ForegroundColor Yellow
    exit 1
}

# Load .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$DATAVERSE_URL = $env:DATAVERSE_URL
$AZURE_TENANT_ID = $env:AZURE_TENANT_ID
$AZURE_CLIENT_ID = $env:AZURE_CLIENT_ID
$AZURE_CLIENT_SECRET = $env:AZURE_CLIENT_SECRET
$API_VERSION = if ($env:DATAVERSE_API_VERSION) { $env:DATAVERSE_API_VERSION } else { "v9.2" }

if (-not $DATAVERSE_URL -or -not $AZURE_TENANT_ID -or -not $AZURE_CLIENT_ID -or -not $AZURE_CLIENT_SECRET) {
    Write-Host "❌ Missing required environment variables in .env" -ForegroundColor Red
    exit 1
}

Write-Host "Configuration:" -ForegroundColor Green
Write-Host "   Dataverse URL: $DATAVERSE_URL"
Write-Host "   API Version: $API_VERSION"
Write-Host "   Tenant ID: $($AZURE_TENANT_ID.Substring(0,8))..."
Write-Host ""

Write-Host "Step 1: Getting Azure AD access token..." -ForegroundColor Yellow
Write-Host ""

# Get token using Node.js
$tokenScript = @"
const { ClientSecretCredential } = require('@azure/identity');
require('dotenv').config();

async function getToken() {
    const credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
    );
    const tokenResponse = await credential.getToken(process.env.DATAVERSE_URL + '/.default');
    console.log(tokenResponse.token);
}

getToken().catch(err => {
    console.error('Failed to get token:', err.message);
    process.exit(1);
});
"@

$TOKEN = node -e $tokenScript 2>&1

if ($LASTEXITCODE -ne 0 -or -not $TOKEN) {
    Write-Host "❌ Failed to acquire access token" -ForegroundColor Red
    Write-Host "   Check your Azure AD credentials in .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Token acquired successfully" -ForegroundColor Green
Write-Host ""

# Build API URL
$API_URL = "$DATAVERSE_URL/api/data/$API_VERSION/dfsa_authorised_individuals"

Write-Host "Step 2: Testing Dataverse API endpoint" -ForegroundColor Yellow
Write-Host "   URL: $API_URL"
Write-Host ""

# Test 1: List records
Write-Host "Test 1: Listing records (top 5)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "cURL Command:" -ForegroundColor Gray
Write-Host "curl -X GET `"$API_URL``$top=5&``$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd,createdon&``$orderby=createdon desc`" \"
Write-Host "  -H `"Authorization: Bearer [TOKEN]`" \"
Write-Host "  -H `"Content-Type: application/json`" \"
Write-Host "  -H `"OData-Version: 4.0`""
Write-Host ""

$queryUrl = "$API_URL" + '?$top=5&$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd,createdon&$orderby=createdon desc'

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
    "OData-Version" = "4.0"
    "Accept" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $queryUrl -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ Success! Found $($response.value.Count) record(s)" -ForegroundColor Green
    Write-Host ""
    
    if ($response.value.Count -gt 0) {
        Write-Host "Sample Records:" -ForegroundColor Cyan
        for ($i = 0; $i -lt [Math]::Min(5, $response.value.Count); $i++) {
            $record = $response.value[$i]
            Write-Host "  $($i+1). ID: $($record.dfsa_authorised_individualid)" -ForegroundColor White
            Write-Host "     Name: $($record.dfsa_proposedauthorisedindividualname)" -ForegroundColor Gray
            Write-Host "     Firm: $($record.dfsa_firmnamesd)" -ForegroundColor Gray
            Write-Host "     Created: $($record.createdon)" -ForegroundColor Gray
            Write-Host ""
        }
        
        # Test 2: Fetch single record
        $firstId = $response.value[0].dfsa_authorised_individualid
        Write-Host "Test 2: Fetching single record..." -ForegroundColor Cyan
        Write-Host "   Record ID: $firstId" -ForegroundColor White
        Write-Host ""
        
        $singleUrl = "$API_URL($firstId)" + '?$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd'
        
        Write-Host "cURL Command:" -ForegroundColor Gray
        Write-Host "curl -X GET `"$singleUrl`" \"
        Write-Host "  -H `"Authorization: Bearer [TOKEN]`" \"
        Write-Host "  -H `"Content-Type: application/json`" \"
        Write-Host "  -H `"OData-Version: 4.0`""
        Write-Host ""
        
        $singleResponse = Invoke-RestMethod -Uri $singleUrl -Method Get -Headers $headers -ErrorAction Stop
        
        Write-Host "✅ Single record fetched successfully:" -ForegroundColor Green
        $singleResponse | ConvertTo-Json -Depth 3
        Write-Host ""
        
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "✅ Dataverse Integration Test PASSED" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "The API endpoint is working correctly!" -ForegroundColor Cyan
        Write-Host "You can now use the service to fetch records." -ForegroundColor Cyan
        
    } else {
        Write-Host "⚠️  No records found in the table" -ForegroundColor Yellow
        Write-Host "   This is OK - the connection works, but there are no records yet." -ForegroundColor Yellow
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.Exception.Message
    
    Write-Host "❌ Request failed" -ForegroundColor Red
    Write-Host "   Status: $statusCode" -ForegroundColor Red
    Write-Host "   Error: $errorMessage" -ForegroundColor Red
    Write-Host ""
    
    if ($statusCode -eq 401) {
        Write-Host "💡 Hint: Check your Azure AD credentials" -ForegroundColor Yellow
    } elseif ($statusCode -eq 403) {
        Write-Host "💡 Hint: Ensure app registration has Dataverse API permissions" -ForegroundColor Yellow
    } elseif ($statusCode -eq 404) {
        Write-Host "💡 Hint: Check entity name: dfsa_authorised_individuals" -ForegroundColor Yellow
    }
    
    exit 1
}

