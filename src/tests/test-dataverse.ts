/**
 * Test Dataverse Connection
 * Run: npm run test:dataverse
 *
 * This test verifies:
 * 1. Azure AD authentication works
 * 2. Dataverse API is accessible
 * 3. Can fetch Authorised Individual records
 */

import logger from '../utils/logger';
import dataverseClient from '../services/dataverse/dataverseClient';

async function testDataverseConnection() {
  console.log('='.repeat(60));
  console.log('DFSA Dataverse Connection Test');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test 1: Get Token
    console.log('Test 1: Acquiring Dataverse token...');
    const token = await dataverseClient.getToken();
    console.log('✅ Token acquired successfully');
    console.log(`   Token length: ${token.length} characters`);
    console.log('');

    // Test 2: List Records
    console.log('Test 2: Fetching recent Authorised Individual records...');
    const records = await dataverseClient.queryAuthorisedIndividuals(undefined, 5);
    console.log(`✅ Found ${records.length} record(s)`);
    console.log('');

    if (records.length > 0) {
      console.log('Sample Records:');
      records.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.dfsa_authorised_individualid}`);
        console.log(`     Name: ${record.dfsa_proposedauthorisedindividualname || 'N/A'}`);
        console.log(`     Firm: ${record.dfsa_firmnamesd || 'N/A'}`);
        console.log(`     Created: ${record.createdon || 'N/A'}`);
        console.log('');
      });

      // Test 3: Fetch Single Record
      const testId = records[0].dfsa_authorised_individualid;
      console.log(`Test 3: Fetching single record with ID: ${testId}...`);
      const singleRecord = await dataverseClient.getAuthorisedIndividual(testId);
      console.log('✅ Record fetched successfully');
      console.log(`   Record ID: ${singleRecord.dfsa_authorised_individualid}`);
      console.log(`   Name: ${singleRecord.dfsa_proposedauthorisedindividualname || 'N/A'}`);
      console.log(`   Has Passport Details: ${!!singleRecord.cr5f7_AI_Q12_CandidateInfo}`);
      console.log(`   Has Citizenships: ${!!singleRecord.cr5f7_dfsa_Authorised_Individual_AI_Q13_CitizenshipInfo_dfsa_ROAF_authorised_Individual_AICIQ13}`);
      console.log(`   Has Regulatory History: ${!!singleRecord.cr5f7_dfsa_Authorised_Individual_AI_Q28_LicenceDetails_dfsa_ROAF_authorised_Individual_AICIQ28}`);
      console.log('');

      // Debug: Log the actual structure of related entities
      console.log('DEBUG: Related Entity Structures:');
      console.log('');
      console.log('Passport Details:');
      console.log(JSON.stringify(singleRecord.cr5f7_AI_Q12_CandidateInfo, null, 2));
      console.log('');
      console.log('Citizenships:');
      console.log(JSON.stringify(singleRecord.cr5f7_dfsa_Authorised_Individual_AI_Q13_CitizenshipInfo_dfsa_ROAF_authorised_Individual_AICIQ13, null, 2));
      console.log('');
      console.log('Regulatory History:');
      console.log(JSON.stringify(singleRecord.cr5f7_dfsa_Authorised_Individual_AI_Q28_LicenceDetails_dfsa_ROAF_authorised_Individual_AICIQ28, null, 2));
      console.log('');
    } else {
      console.log('⚠️  No records found in Dataverse');
      console.log('   Please create at least one Authorised Individual record to test with');
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ All Dataverse tests passed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ Dataverse test failed');
    console.error('='.repeat(60));
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('');

    if (error instanceof Error && error.message.includes('token')) {
      console.error('💡 Hint: Check your .env file:');
      console.error('   - AZURE_TENANT_ID');
      console.error('   - AZURE_CLIENT_ID');
      console.error('   - AZURE_CLIENT_SECRET');
      console.error('   - DATAVERSE_URL');
    }

    console.error('');
    process.exit(1);
  }
}

// Run test
testDataverseConnection();
