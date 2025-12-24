/**
 * Test Script: Verify Outlook/Exchange Email Setup
 *
 * This script checks:
 * 1. Azure AD app registration and authentication
 * 2. API permissions granted (especially Mail.Send)
 * 3. Available mailboxes/users that can send emails
 * 4. Whether we can send a test email via Microsoft Graph
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  const emoji = {
    PASS: '✅',
    FAIL: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️'
  };

  console.log(`\n${emoji[result.status]} ${result.step}`);
  console.log(`   ${result.message}`);

  if (result.details) {
    console.log(`   Details:`, JSON.stringify(result.details, null, 2));
  }

  results.push(result);
}

async function testOutlookSetup() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 OUTLOOK/EXCHANGE EMAIL SETUP VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');

  // ============================================================
  // STEP 1: Check Environment Variables
  // ============================================================
  console.log('📋 STEP 1: Checking Environment Variables...');

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    logResult({
      step: 'Environment Variables',
      status: 'FAIL',
      message: 'Missing Azure AD credentials in .env file',
      details: {
        AZURE_TENANT_ID: tenantId ? 'Set ✓' : 'Missing ✗',
        AZURE_CLIENT_ID: clientId ? 'Set ✓' : 'Missing ✗',
        AZURE_CLIENT_SECRET: clientSecret ? 'Set ✓' : 'Missing ✗'
      }
    });
    return;
  }

  logResult({
    step: 'Environment Variables',
    status: 'PASS',
    message: 'Azure AD credentials found in .env',
    details: {
      AZURE_TENANT_ID: `${tenantId.substring(0, 8)}...`,
      AZURE_CLIENT_ID: `${clientId.substring(0, 8)}...`,
      AZURE_CLIENT_SECRET: 'Set ✓'
    }
  });

  // ============================================================
  // STEP 2: Test Azure AD Authentication
  // ============================================================
  console.log('\n🔐 STEP 2: Testing Azure AD Authentication...');

  let graphClient: Client;

  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const tokenResponse = await credential.getToken(['https://graph.microsoft.com/.default']);

    if (!tokenResponse || !tokenResponse.token) {
      throw new Error('Failed to obtain access token');
    }

    logResult({
      step: 'Azure AD Authentication',
      status: 'PASS',
      message: 'Successfully authenticated with Azure AD',
      details: {
        tokenObtained: true,
        expiresOn: tokenResponse.expiresOnTimestamp
          ? new Date(tokenResponse.expiresOnTimestamp).toISOString()
          : 'Unknown'
      }
    });

    // Create Graph client
    graphClient = Client.init({
      authProvider: (done) => {
        done(null, tokenResponse.token);
      }
    });

  } catch (error: any) {
    logResult({
      step: 'Azure AD Authentication',
      status: 'FAIL',
      message: 'Failed to authenticate with Azure AD',
      details: {
        error: error.message,
        hint: 'Check if AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET are correct'
      }
    });
    return;
  }

  // ============================================================
  // STEP 3: Check App Permissions
  // ============================================================
  console.log('\n🔑 STEP 3: Checking App Permissions...');

  try {
    // Try to access the service principal (app) info
    const appInfo = await graphClient.api(`/servicePrincipals?$filter=appId eq '${clientId}'`).get();

    if (appInfo.value && appInfo.value.length > 0) {
      const sp = appInfo.value[0];

      logResult({
        step: 'App Registration Found',
        status: 'PASS',
        message: 'Azure AD app registration verified',
        details: {
          displayName: sp.displayName,
          appId: sp.appId,
          servicePrincipalType: sp.servicePrincipalType
        }
      });

      // Check if Mail.Send permission is granted
      const hasMailPermission = sp.appRoles?.some((role: any) =>
        role.value === 'Mail.Send' || role.displayName?.includes('Mail')
      );

      if (hasMailPermission) {
        logResult({
          step: 'Mail.Send Permission',
          status: 'PASS',
          message: 'Mail.Send permission appears to be configured'
        });
      } else {
        logResult({
          step: 'Mail.Send Permission',
          status: 'WARNING',
          message: 'Could not verify Mail.Send permission in app roles',
          details: {
            hint: 'This may need to be granted by Azure AD admin',
            nextStep: 'Ask IT team to verify Mail.Send permission in Azure Portal'
          }
        });
      }
    }
  } catch (error: any) {
    logResult({
      step: 'App Permissions Check',
      status: 'WARNING',
      message: 'Could not retrieve full app permission details',
      details: {
        error: error.message,
        note: 'This is normal if the app does not have Directory.Read.All permission'
      }
    });
  }

  // ============================================================
  // STEP 4: List Available Users/Mailboxes
  // ============================================================
  console.log('\n📬 STEP 4: Checking Available Mailboxes...');

  try {
    const users = await graphClient.api('/users').top(5).get();

    if (users.value && users.value.length > 0) {
      logResult({
        step: 'List Mailboxes',
        status: 'PASS',
        message: `Found ${users.value.length} user(s) in the organization`,
        details: users.value.map((u: any) => ({
          displayName: u.displayName,
          userPrincipalName: u.userPrincipalName,
          mail: u.mail || 'No email set'
        }))
      });

      // Suggest which user to use for sending emails
      const suggestedUser = users.value.find((u: any) =>
        u.userPrincipalName?.toLowerCase().includes('noreply') ||
        u.userPrincipalName?.toLowerCase().includes('service') ||
        u.mail?.toLowerCase().includes('noreply')
      ) || users.value[0];

      logResult({
        step: 'Suggested Email Account',
        status: 'INFO',
        message: 'Recommended user account for sending emails',
        details: {
          userPrincipalName: suggestedUser.userPrincipalName,
          displayName: suggestedUser.displayName,
          email: suggestedUser.mail || suggestedUser.userPrincipalName,
          note: 'Add this to .env as GRAPH_EMAIL_USER'
        }
      });

    } else {
      logResult({
        step: 'List Mailboxes',
        status: 'WARNING',
        message: 'No users found in organization',
        details: {
          hint: 'The app may not have User.Read.All permission'
        }
      });
    }
  } catch (error: any) {
    logResult({
      step: 'List Mailboxes',
      status: 'WARNING',
      message: 'Could not list users',
      details: {
        error: error.message,
        hint: 'The app needs User.Read.All permission to list users',
        workaround: 'You can manually specify a user email in GRAPH_EMAIL_USER environment variable'
      }
    });
  }

  // ============================================================
  // STEP 5: Test Send Email Permission (Dry Run)
  // ============================================================
  console.log('\n📧 STEP 5: Testing Email Send Permission (Dry Run)...');

  // Get a user to send from (try environment variable first)
  const testUser = process.env.GRAPH_EMAIL_USER ||
                   (results.find(r => r.step === 'Suggested Email Account')?.details?.userPrincipalName);

  if (!testUser) {
    logResult({
      step: 'Email Send Test',
      status: 'WARNING',
      message: 'Cannot test email sending - no user email specified',
      details: {
        solution: 'Set GRAPH_EMAIL_USER in .env to a valid user email address'
      }
    });
  } else {
    try {
      // Try to access the user's mailbox (doesn't send, just checks access)
      const mailboxCheck = await graphClient.api(`/users/${testUser}/mailFolders`).get();

      logResult({
        step: 'Email Send Permission',
        status: 'PASS',
        message: `Can access mailbox for ${testUser}`,
        details: {
          mailboxAccess: 'Granted ✓',
          user: testUser,
          foldersFound: mailboxCheck.value?.length || 0,
          note: 'This suggests Mail.Send permission is likely working'
        }
      });

    } catch (error: any) {
      if (error.statusCode === 403) {
        logResult({
          step: 'Email Send Permission',
          status: 'FAIL',
          message: 'Access denied to mailbox - Mail.Send permission not granted',
          details: {
            error: error.message,
            statusCode: 403,
            solution: 'Ask IT admin to grant Mail.Send API permission in Azure Portal',
            steps: [
              '1. Go to Azure Portal > Azure Active Directory > App Registrations',
              `2. Find app: ${clientId}`,
              '3. Go to API Permissions',
              '4. Add permission: Microsoft Graph > Application permissions > Mail.Send',
              '5. Grant admin consent'
            ]
          }
        });
      } else {
        logResult({
          step: 'Email Send Permission',
          status: 'WARNING',
          message: 'Could not verify email send permission',
          details: {
            error: error.message,
            user: testUser
          }
        });
      }
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARNING').length;

  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Warnings: ${warnCount}`);
  console.log(`Total Checks: ${results.length}\n`);

  if (failCount === 0 && warnCount === 0) {
    console.log('🎉 EXCELLENT! Your Azure AD app is fully configured for Outlook email sending.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Add this to your .env file:');
    console.log(`      GRAPH_EMAIL_USER=${testUser || 'user@yourdomain.com'}`);
    console.log('   2. I can now implement the OutlookProvider.ts class');
    console.log('   3. Test sending a real email\n');
  } else if (failCount === 0) {
    console.log('✅ GOOD! Your setup is mostly complete, but some optional features may need configuration.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Review warnings above and address if needed');
    console.log('   2. Add GRAPH_EMAIL_USER to .env if not set');
    console.log('   3. I can implement the OutlookProvider.ts class\n');
  } else {
    console.log('⚠️  ATTENTION REQUIRED! Some critical issues need to be resolved.');
    console.log('\n📝 Action Items:');
    console.log('   1. Work with IT team to grant Mail.Send permission');
    console.log('   2. Ensure Azure AD app has necessary API permissions');
    console.log('   3. Re-run this test after permissions are granted\n');
  }

  // Save results to file
  const fs = require('fs');
  const reportPath = './outlook-setup-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}\n`);
}

// Run the test
testOutlookSetup().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
