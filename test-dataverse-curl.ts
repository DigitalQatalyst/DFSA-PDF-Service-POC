/**
 * Test Dataverse Connection via Direct API Call
 * This script tests the Dataverse API endpoint directly
 * Run: ts-node test-dataverse-curl.ts
 */

import axios from 'axios';
import { ClientSecretCredential } from '@azure/identity';
import dotenv from 'dotenv';

dotenv.config();

const DATAVERSE_URL = process.env.DATAVERSE_URL;
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const API_VERSION = process.env.DATAVERSE_API_VERSION || 'v9.2';

async function testDataverseConnection() {
  console.log('='.repeat(70));
  console.log('Dataverse API Connection Test');
  console.log('='.repeat(70));
  console.log('');

  // Validate environment variables
  if (!DATAVERSE_URL || !TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing required environment variables:');
    console.error('   Required: DATAVERSE_URL, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`   Dataverse URL: ${DATAVERSE_URL}`);
  console.log(`   API Version: ${API_VERSION}`);
  console.log(`   Tenant ID: ${TENANT_ID.substring(0, 8)}...`);
  console.log(`   Client ID: ${CLIENT_ID.substring(0, 8)}...`);
  console.log('');

  try {
    // Step 1: Get Access Token
    console.log('Step 1: Acquiring Azure AD access token...');
    const credential = new ClientSecretCredential(
      TENANT_ID,
      CLIENT_ID,
      CLIENT_SECRET
    );

    const tokenResponse = await credential.getToken(`${DATAVERSE_URL}/.default`);
    const accessToken = tokenResponse.token;
    
    console.log('✅ Token acquired successfully');
    console.log(`   Token length: ${accessToken.length} characters`);
    console.log(`   Expires: ${new Date(tokenResponse.expiresOnTimestamp).toISOString()}`);
    console.log('');

    // Step 2: Test API Endpoint
    const apiUrl = `${DATAVERSE_URL}/api/data/${API_VERSION}/dfsa_authorised_individuals`;
    console.log('Step 2: Testing Dataverse API endpoint...');
    console.log(`   URL: ${apiUrl}`);
    console.log('');

    // Make request with top=5 to get a few records
    const queryUrl = `${apiUrl}?$top=5&$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd,createdon&$orderby=createdon desc`;

    console.log('Making GET request...');
    console.log(`   Query: ${queryUrl}`);
    console.log('');

    const response = await axios.get(queryUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'OData-Version': '4.0',
        'OData-MaxVersion': '4.0',
        'Accept': 'application/json'
      },
      validateStatus: (status) => status < 500 // Don't throw on 4xx
    });

    console.log('Response Status:', response.status);
    console.log('');

    if (response.status === 200) {
      const records = response.data.value || [];
      console.log(`✅ Success! Found ${records.length} record(s)`);
      console.log('');

      if (records.length > 0) {
        console.log('Sample Records:');
        console.log('-'.repeat(70));
        records.forEach((record: any, index: number) => {
          console.log(`\n${index + 1}. Record ID: ${record.dfsa_authorised_individualid}`);
          console.log(`   Name: ${record.dfsa_proposedauthorisedindividualname || 'N/A'}`);
          console.log(`   Firm: ${record.dfsa_firmnamesd || 'N/A'}`);
          console.log(`   Created: ${record.createdon || 'N/A'}`);
        });
        console.log('');
        console.log('-'.repeat(70));
        console.log('');

        // Step 3: Test fetching a single record
        const testRecordId = records[0].dfsa_authorised_individualid;
        console.log(`Step 3: Fetching single record with ID: ${testRecordId}...`);
        
        const singleRecordUrl = `${apiUrl}(${testRecordId})?$select=dfsa_authorised_individualid,dfsa_proposedauthorisedindividualname,dfsa_firmnamesd,dfsa_address,dfsa_contactemailaddress`;
        
        const singleResponse = await axios.get(singleRecordUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'OData-Version': '4.0',
            'OData-MaxVersion': '4.0',
            'Accept': 'application/json'
          }
        });

        if (singleResponse.status === 200) {
          console.log('✅ Single record fetched successfully');
          console.log('   Record Data:');
          console.log(JSON.stringify(singleResponse.data, null, 2));
        } else {
          console.log(`⚠️  Unexpected status: ${singleResponse.status}`);
        }
      } else {
        console.log('⚠️  No records found in the table');
        console.log('   This is OK - the connection works, but there are no records yet.');
      }

      console.log('');
      console.log('='.repeat(70));
      console.log('✅ Dataverse Integration Test PASSED');
      console.log('='.repeat(70));
      console.log('');
      console.log('Next steps:');
      console.log('  1. The API endpoint is working correctly');
      console.log('  2. You can now use the service to fetch records');
      console.log('  3. Test PDF generation with: npm run test:pdf');
      console.log('');

    } else if (response.status === 401) {
      console.error('❌ Authentication failed (401 Unauthorized)');
      console.error('   Check your Azure AD credentials:');
      console.error('   - AZURE_TENANT_ID');
      console.error('   - AZURE_CLIENT_ID');
      console.error('   - AZURE_CLIENT_SECRET');
      console.error('   - Ensure app registration has Dataverse API permissions');
      process.exit(1);
    } else if (response.status === 403) {
      console.error('❌ Access forbidden (403 Forbidden)');
      console.error('   The app registration may not have the required permissions');
      console.error('   Ensure the app has "Dynamics CRM" API permissions with admin consent');
      process.exit(1);
    } else if (response.status === 404) {
      console.error('❌ Endpoint not found (404)');
      console.error(`   Check if the entity name is correct: dfsa_authorised_individuals`);
      console.error(`   Verify DATAVERSE_URL is correct: ${DATAVERSE_URL}`);
      process.exit(1);
    } else {
      console.error(`❌ Unexpected response status: ${response.status}`);
      console.error('Response:', JSON.stringify(response.data, null, 2));
      process.exit(1);
    }

  } catch (error: any) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ Test Failed');
    console.error('='.repeat(70));
    console.error('');

    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:');
      console.error(`   Message: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Status Text: ${error.response.statusText}`);
        console.error(`   Response Data:`, JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('   No response received from server');
        console.error('   Check network connectivity and DATAVERSE_URL');
      }
    } else {
      console.error('Error:', error.message || error);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }

    console.error('');
    process.exit(1);
  }
}

// Run test
testDataverseConnection();

