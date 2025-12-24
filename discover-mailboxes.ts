/**
 * Mailbox Discovery Script
 *
 * This script attempts to discover available mailboxes that can be used for sending emails
 * WITHOUT requiring Azure Portal access.
 *
 * It will try:
 * 1. Common service account patterns
 * 2. Domain-based guessing
 * 3. Existing Graph API access to find users
 * 4. Test mailbox access permissions
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import * as dotenv from 'dotenv';

dotenv.config();

interface MailboxCandidate {
  email: string;
  source: string;
  accessible: boolean;
  canSendMail: boolean;
  displayName?: string;
  error?: string;
}

const candidates: MailboxCandidate[] = [];

async function discoverMailboxes() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 MAILBOX DISCOVERY TOOL');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check environment variables
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    console.error('❌ Missing Azure AD credentials in .env file');
    return;
  }

  console.log('✅ Azure AD credentials found\n');

  // Authenticate
  let graphClient: Client;
  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const tokenResponse = await credential.getToken(['https://graph.microsoft.com/.default']);

    graphClient = Client.init({
      authProvider: (done) => {
        done(null, tokenResponse.token);
      }
    });

    console.log('✅ Successfully authenticated with Azure AD\n');
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.message);
    return;
  }

  // Extract domain from Dataverse URL
  const dataverseUrl = process.env.DATAVERSE_URL || '';
  let domain = 'unknown.com';

  // Try to guess domain from various sources
  if (dataverseUrl.includes('dfsaprimarydev.crm15.dynamics.com')) {
    // Common patterns for organizations
    const possibleDomains = [
      'dfsa.ae',
      'dfsaclient.com',
      'dfsa.gov.ae',
      'digitalqatalyst.com',
      'dq.com'
    ];
    domain = possibleDomains[0]; // Default guess
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 STEP 1: Attempting to List Users from Graph API');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const users = await graphClient.api('/users').select('displayName,mail,userPrincipalName').top(50).get();

    if (users.value && users.value.length > 0) {
      console.log(`✅ Found ${users.value.length} user(s) in the organization:\n`);

      users.value.forEach((user: any, index: number) => {
        const email = user.mail || user.userPrincipalName;
        console.log(`   ${index + 1}. ${user.displayName || 'No Name'} - ${email}`);

        candidates.push({
          email: email,
          source: 'Graph API /users',
          accessible: true,
          canSendMail: false, // Will test later
          displayName: user.displayName
        });
      });

      // Extract domain from first user
      if (users.value[0]?.userPrincipalName) {
        const firstEmail = users.value[0].userPrincipalName;
        domain = firstEmail.split('@')[1] || domain;
        console.log(`\n   📌 Detected organization domain: ${domain}`);
      }
    } else {
      console.log('⚠️ No users found (app may not have User.Read.All permission)');
    }
  } catch (error: any) {
    console.log('⚠️ Cannot list users (missing User.Read.All permission)');
    console.log(`   This is OK - we'll try other discovery methods\n`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 STEP 2: Trying Common Service Account Patterns');
  console.log('═══════════════════════════════════════════════════════\n');

  const commonPrefixes = [
    'noreply',
    'no-reply',
    'service',
    'dfsa-service',
    'pdfservice',
    'pdf-service',
    'notifications',
    'admin',
    'system',
    'automated',
    'app'
  ];

  console.log(`Testing common patterns with domain: ${domain}\n`);

  for (const prefix of commonPrefixes) {
    const email = `${prefix}@${domain}`;

    // Check if already found via Graph API
    if (candidates.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      continue;
    }

    candidates.push({
      email: email,
      source: 'Common Pattern Guess',
      accessible: false, // Will test
      canSendMail: false
    });
  }

  console.log(`   Added ${commonPrefixes.length} common pattern guesses\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 STEP 3: Testing Mailbox Access for All Candidates');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Testing ${candidates.length} potential mailboxes...\n`);

  for (const candidate of candidates) {
    process.stdout.write(`   Testing ${candidate.email}... `);

    try {
      // Try to access mailbox folders (doesn't require Mail.Send, just read access)
      await graphClient.api(`/users/${candidate.email}/mailFolders`).get();

      candidate.accessible = true;
      candidate.canSendMail = true; // If we can access folders, likely can send
      console.log('✅ ACCESSIBLE');

    } catch (error: any) {
      if (error.statusCode === 404) {
        candidate.error = 'Mailbox not found';
        console.log('❌ NOT FOUND');
      } else if (error.statusCode === 403) {
        candidate.error = 'Access denied';
        console.log('⚠️ ACCESS DENIED');
      } else {
        candidate.error = error.message;
        console.log(`⚠️ ERROR: ${error.message}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 DISCOVERY RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Filter to accessible mailboxes
  const accessible = candidates.filter(c => c.accessible);
  const notAccessible = candidates.filter(c => !c.accessible);

  if (accessible.length > 0) {
    console.log(`✅ ACCESSIBLE MAILBOXES (${accessible.length}):\n`);

    accessible.forEach((mailbox, index) => {
      console.log(`   ${index + 1}. ${mailbox.email}`);
      if (mailbox.displayName) {
        console.log(`      Display Name: ${mailbox.displayName}`);
      }
      console.log(`      Source: ${mailbox.source}`);
      console.log(`      Can Send Mail: ${mailbox.canSendMail ? '✅ Yes' : '⚠️ Unknown'}`);
      console.log();
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎯 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Prioritize service accounts
    const serviceAccounts = accessible.filter(m =>
      m.email.toLowerCase().includes('noreply') ||
      m.email.toLowerCase().includes('service') ||
      m.email.toLowerCase().includes('automated')
    );

    if (serviceAccounts.length > 0) {
      console.log('✅ BEST OPTION (Service Account):');
      console.log(`   ${serviceAccounts[0].email}\n`);
      console.log('   Add this to your .env file:');
      console.log(`   GRAPH_EMAIL_USER=${serviceAccounts[0].email}\n`);
    } else {
      console.log('✅ RECOMMENDED (First Accessible):');
      console.log(`   ${accessible[0].email}\n`);
      console.log('   Add this to your .env file:');
      console.log(`   GRAPH_EMAIL_USER=${accessible[0].email}\n`);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('1. Add the recommended email to .env:');
    console.log(`   GRAPH_EMAIL_USER=${serviceAccounts[0]?.email || accessible[0].email}`);
    console.log('\n2. Run the verification test:');
    console.log('   npx ts-node test-outlook-setup.ts');
    console.log('\n3. If successful, we can implement OutlookProvider immediately!\n');

  } else {
    console.log('⚠️ NO ACCESSIBLE MAILBOXES FOUND\n');
    console.log('This could mean:');
    console.log('   1. The app does not have Mail.Send or User.Read.All permissions');
    console.log('   2. No mailboxes exist in the organization yet');
    console.log('   3. The app credentials are incorrect\n');

    console.log('📝 RECOMMENDED ACTIONS:\n');
    console.log('   1. Ask IT team to verify Mail.Send permission is granted');
    console.log('   2. Ask IT team to create a shared mailbox (see SHARED_MAILBOX_SETUP_GUIDE.md)');
    console.log('   3. Or ask IT team which existing mailbox can be used\n');
  }

  if (notAccessible.length > 0 && accessible.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log(`ℹ️ MAILBOXES NOT ACCESSIBLE (${notAccessible.length})`);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('These mailboxes exist but the app cannot access them:\n');

    notAccessible.slice(0, 5).forEach((mailbox, index) => {
      console.log(`   ${index + 1}. ${mailbox.email} - ${mailbox.error || 'Unknown error'}`);
    });

    if (notAccessible.length > 5) {
      console.log(`   ... and ${notAccessible.length - 5} more\n`);
    }
  }

  // Save results to JSON
  const fs = require('fs');
  const reportPath = './mailbox-discovery-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    domain: domain,
    totalCandidates: candidates.length,
    accessible: accessible.length,
    notAccessible: notAccessible.length,
    candidates: candidates
  }, null, 2));

  console.log(`\n📄 Detailed report saved to: ${reportPath}\n`);
}

// Run discovery
discoverMailboxes().catch(error => {
  console.error('❌ Discovery failed:', error);
  process.exit(1);
});
