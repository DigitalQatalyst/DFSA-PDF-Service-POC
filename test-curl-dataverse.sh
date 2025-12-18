#!/bin/bash
# Test Dataverse Connection via cURL
# This script demonstrates how to call the Dataverse API using curl
# 
# Prerequisites:
# 1. Azure AD credentials configured in .env file
# 2. Node.js script will get the token, then show you the curl command
#
# Usage: bash test-curl-dataverse.sh

echo "============================================================"
echo "Dataverse API cURL Test"
echo "============================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Please create .env file with:"
    echo "   - AZURE_TENANT_ID"
    echo "   - AZURE_CLIENT_ID"
    echo "   - AZURE_CLIENT_SECRET"
    echo "   - DATAVERSE_URL"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$DATAVERSE_URL" ] || [ -z "$AZURE_TENANT_ID" ] || [ -z "$AZURE_CLIENT_ID" ] || [ -z "$AZURE_CLIENT_SECRET" ]; then
    echo "❌ Missing required environment variables in .env"
    exit 1
fi

echo "Step 1: Getting Azure AD access token..."
echo ""

# Use Node.js to get the token (since curl can't easily do OAuth2 client credentials)
TOKEN=$(node -e "
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
")

if [ $? -ne 0 ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to acquire access token"
    echo "   Check your Azure AD credentials in .env"
    exit 1
fi

echo "✅ Token acquired successfully"
echo ""

# Build API URL
API_VERSION=${DATAVERSE_API_VERSION:-v9.2}
API_URL="${DATAVERSE_URL}/api/data/${API_VERSION}/dfsa_authorised_individuals"

echo "Step 2: Testing Dataverse API endpoint"
echo "   URL: ${API_URL}"
echo ""

# Test 1: List records (top 5)
echo "Test 1: Listing records (top 5)..."
echo ""
echo "cURL Command:"
echo "curl -X GET \\"
echo "  '${API_URL}?\$top=5&\$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd,createdon&\$orderby=createdon desc' \\"
echo "  -H 'Authorization: Bearer [TOKEN]' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'OData-Version: 4.0' \\"
echo "  -H 'Accept: application/json'"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "${API_URL}?\$top=5&\$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd,createdon&\$orderby=createdon desc" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "OData-Version: 4.0" \
  -H "Accept: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response Status: ${HTTP_CODE}"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Success! Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    
    # Extract first record ID for single record test
    FIRST_ID=$(echo "$BODY" | jq -r '.value[0].dfsa_authorised_individualid' 2>/dev/null)
    
    if [ -n "$FIRST_ID" ] && [ "$FIRST_ID" != "null" ]; then
        echo "Test 2: Fetching single record..."
        echo "   Record ID: ${FIRST_ID}"
        echo ""
        echo "cURL Command:"
        echo "curl -X GET \\"
        echo "  '${API_URL}(${FIRST_ID})?\$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd' \\"
        echo "  -H 'Authorization: Bearer [TOKEN]' \\"
        echo "  -H 'Content-Type: application/json' \\"
        echo "  -H 'OData-Version: 4.0'"
        echo ""
        
        SINGLE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
          "${API_URL}(${FIRST_ID})?\$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd" \
          -H "Authorization: Bearer ${TOKEN}" \
          -H "Content-Type: application/json" \
          -H "OData-Version: 4.0" \
          -H "Accept: application/json")
        
        SINGLE_HTTP_CODE=$(echo "$SINGLE_RESPONSE" | tail -n1)
        SINGLE_BODY=$(echo "$SINGLE_RESPONSE" | sed '$d')
        
        echo "Response Status: ${SINGLE_HTTP_CODE}"
        if [ "$SINGLE_HTTP_CODE" = "200" ]; then
            echo "✅ Single record fetched successfully:"
            echo "$SINGLE_BODY" | jq '.' 2>/dev/null || echo "$SINGLE_BODY"
        else
            echo "⚠️  Unexpected status: ${SINGLE_HTTP_CODE}"
            echo "$SINGLE_BODY"
        fi
    fi
    
    echo ""
    echo "============================================================"
    echo "✅ Dataverse Integration Test PASSED"
    echo "============================================================"
    
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Authentication failed (401 Unauthorized)"
    echo "   Check your Azure AD credentials"
    exit 1
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ Access forbidden (403)"
    echo "   Ensure app registration has Dataverse API permissions"
    exit 1
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Endpoint not found (404)"
    echo "   Check entity name: dfsa_authorised_individuals"
    exit 1
else
    echo "❌ Unexpected status: ${HTTP_CODE}"
    echo "Response: $BODY"
    exit 1
fi

