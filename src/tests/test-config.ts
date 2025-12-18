/**
 * Configuration Validation Test
 * Run: npm run test:config
 *
 * This test verifies:
 * 1. All required environment variables are set
 * 2. No placeholder values remain
 * 3. URLs are properly formatted
 * 4. Configuration readiness for demo
 */

import env from '../config/env';

function validateConfig() {
  console.log('='.repeat(60));
  console.log('DFSA Configuration Validation');
  console.log('='.repeat(60));
  console.log('');

  let errors = 0;
  let warnings = 0;

  // Required Configuration
  console.log('Required Configuration:');
  console.log('='.repeat(60));

  // Azure AD Authentication
  const azureTenantId = process.env.AZURE_TENANT_ID || '';
  if (!azureTenantId || azureTenantId.includes('your-') || azureTenantId.includes('here')) {
    console.error('❌ AZURE_TENANT_ID - Not configured (placeholder value)');
    errors++;
  } else {
    console.log(`✅ AZURE_TENANT_ID - ${azureTenantId}`);
  }

  const azureClientId = process.env.AZURE_CLIENT_ID || '';
  if (!azureClientId || azureClientId.includes('your-') || azureClientId.includes('here')) {
    console.error('❌ AZURE_CLIENT_ID - Not configured (placeholder value)');
    errors++;
  } else {
    console.log(`✅ AZURE_CLIENT_ID - ${azureClientId.substring(0, 8)}...`);
  }

  const azureClientSecret = process.env.AZURE_CLIENT_SECRET || '';
  if (!azureClientSecret || azureClientSecret.includes('your-') || azureClientSecret.includes('here')) {
    console.error('❌ AZURE_CLIENT_SECRET - ⚠️  NOT SET (BLOCKER FOR DEMO)');
    console.error('   This is required to authenticate with Dataverse');
    console.error('   Get from: Azure Portal → App Registrations → Certificates & secrets');
    errors++;
  } else {
    console.log(`✅ AZURE_CLIENT_SECRET - ${azureClientSecret.substring(0, 4)}... (${azureClientSecret.length} chars)`);
  }

  // Dataverse Configuration
  const dataverseUrl = process.env.DATAVERSE_URL || '';
  if (!dataverseUrl || dataverseUrl.includes('your-org')) {
    console.error('❌ DATAVERSE_URL - Not configured (placeholder value)');
    errors++;
  } else if (!dataverseUrl.startsWith('https://')) {
    console.error('❌ DATAVERSE_URL - Must start with https://');
    errors++;
  } else {
    console.log(`✅ DATAVERSE_URL - ${dataverseUrl}`);
  }

  console.log('');

  // Optional Configuration
  console.log('Optional Configuration (PDF Generation):');
  console.log('='.repeat(60));

  // PDF Conversion Engine
  const pdfEngine = process.env.PDF_CONVERSION_ENGINE || 'not set';
  if (!process.env.PDF_CONVERSION_ENGINE) {
    console.warn('⚠️  PDF_CONVERSION_ENGINE - Not set (defaults to "graph")');
    warnings++;
  } else if (pdfEngine !== 'graph' && pdfEngine !== 'libreoffice') {
    console.error(`❌ PDF_CONVERSION_ENGINE - Invalid value: ${pdfEngine} (must be "graph" or "libreoffice")`);
    errors++;
  } else {
    console.log(`✅ PDF_CONVERSION_ENGINE - ${pdfEngine}`);
  }

  // Graph API (if using graph conversion)
  if (pdfEngine === 'graph') {
    const graphTenantId = process.env.GRAPH_TENANT_ID;
    const graphClientId = process.env.GRAPH_CLIENT_ID;
    const graphClientSecret = process.env.GRAPH_CLIENT_SECRET;

    if (!graphTenantId && !graphClientId && !graphClientSecret) {
      console.log('ℹ️  Graph API credentials - Not set (will use main Azure AD credentials)');
    } else if (graphTenantId || graphClientId || graphClientSecret) {
      if (!graphTenantId || graphTenantId.includes('your-')) {
        console.warn('⚠️  GRAPH_TENANT_ID - Incomplete Graph API configuration');
        warnings++;
      }
      if (!graphClientId || graphClientId.includes('your-')) {
        console.warn('⚠️  GRAPH_CLIENT_ID - Incomplete Graph API configuration');
        warnings++;
      }
      if (!graphClientSecret || graphClientSecret.includes('your-')) {
        console.warn('⚠️  GRAPH_CLIENT_SECRET - Incomplete Graph API configuration');
        warnings++;
      }
    }
  }

  // Azure Blob Storage
  const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!storageConnectionString || storageConnectionString.includes('your-')) {
    console.warn('⚠️  AZURE_STORAGE_CONNECTION_STRING - Not set (PDF will not be stored)');
    console.warn('   PDF generation will continue but files won\'t be saved to blob storage');
    warnings++;
  } else {
    console.log(`✅ AZURE_STORAGE_CONNECTION_STRING - Configured (${storageConnectionString.substring(0, 20)}...)`);
  }

  console.log('');

  // Power Pages / CORS Configuration
  console.log('Security Configuration:');
  console.log('='.repeat(60));

  const allowedOrigins = env.ALLOWED_ORIGINS || [];
  if (allowedOrigins.length === 0) {
    console.error('❌ ALLOWED_ORIGINS - Not configured');
    errors++;
  } else {
    console.log(`✅ ALLOWED_ORIGINS - ${allowedOrigins.length} origin(s) configured:`);
    allowedOrigins.forEach(origin => {
      console.log(`   - ${origin}`);
    });
  }

  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('Configuration Summary:');
  console.log('='.repeat(60));
  console.log('');

  if (errors === 0 && warnings === 0) {
    console.log('🎉 ✅ ALL CONFIGURATION VALID');
    console.log('');
    console.log('Service is ready for:');
    console.log('  ✅ POC demonstration');
    console.log('  ✅ Dataverse integration');
    console.log('  ✅ Canonical mapping');
    console.log('  ⚠️  PDF generation (requires DOCX template)');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Run: npm run test:dataverse');
    console.log('  2. Run: npm run test:mapper');
    console.log('  3. Run: npm run dev');
    console.log('');
    process.exit(0);
  } else if (errors === 0 && warnings > 0) {
    console.log(`⚠️  CONFIGURATION INCOMPLETE (${warnings} warning(s))`);
    console.log('');
    console.log('Service is ready for:');
    console.log('  ✅ POC demonstration');
    console.log('  ✅ Dataverse integration');
    console.log('  ✅ Canonical mapping');
    console.log('  ⚠️  PDF generation (optional features missing)');
    console.log('');
    console.log('Warnings can be ignored for POC demo.');
    console.log('');
    process.exit(0);
  } else {
    console.log(`❌ CONFIGURATION ERRORS (${errors} error(s), ${warnings} warning(s))`);
    console.log('');
    console.log('Critical Issues:');
    if (azureClientSecret.includes('your-') || azureClientSecret.includes('here')) {
      console.log('  ❌ AZURE_CLIENT_SECRET is REQUIRED for Dataverse access');
      console.log('     Get from: Azure Portal → App Registrations → Certificates & secrets');
    }
    console.log('');
    console.log('Fix these errors before running:');
    console.log('  - npm run test:dataverse');
    console.log('  - npm run test:mapper');
    console.log('  - npm run dev');
    console.log('');
    process.exit(1);
  }
}

// Run validation
validateConfig();
