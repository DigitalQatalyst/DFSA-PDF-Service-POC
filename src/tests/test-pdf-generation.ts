/**
 * Test PDF Generation Pipeline
 * Run: npm run test:pdf
 *
 * This test verifies the full PDF generation pipeline:
 * 1. Fetch data from Dataverse
 * 2. Map to canonical DTO
 * 3. Generate DOCX from template
 * 4. Convert to PDF (if configured)
 * 5. Store in blob storage (if configured)
 */

import logger from '../utils/logger';
import dataverseClient from '../services/dataverse/dataverseClient';
import { mapToDTO } from '../mappers/authorisedIndividualMapper';
import { generateDocx, validateTemplate } from '../services/templating/docxService';
import { convertToPdf } from '../services/pdf/pdfConverter';
import { storePdf } from '../services/storage/storageService';
import fs from 'fs/promises';
import path from 'path';

async function testPdfGeneration() {
  console.log('='.repeat(60));
  console.log('DFSA PDF Generation Pipeline Test');
  console.log('='.repeat(60));
  console.log('');

  const testOutputDir = path.join(process.cwd(), 'test-output');

  try {
    // Create output directory
    await fs.mkdir(testOutputDir, { recursive: true });

    // Step 1: Fetch test record
    console.log('Step 1: Fetching test record from Dataverse...');
    const records = await dataverseClient.queryAuthorisedIndividuals(undefined, 1);

    if (records.length === 0) {
      console.error('❌ No records found. Please create at least one record.');
      process.exit(1);
    }

    const testId = records[0].dfsa_authorised_individualid;
    console.log(`✅ Found test record: ${testId}`);
    console.log('');

    // Step 2: Fetch full record
    console.log('Step 2: Fetching full record with related entities...');
    const dataverseRecord = await dataverseClient.getAuthorisedIndividual(testId);
    console.log('✅ Record fetched');
    console.log('');

    // Step 3: Map to DTO
    console.log('Step 3: Mapping to canonical DTO...');
    const dto = mapToDTO(dataverseRecord);
    console.log('✅ DTO mapping complete');
    console.log(`   Passport Details: ${dto.PassportDetails.length}`);
    console.log(`   Citizenships: ${dto.Citizenships.length}`);
    console.log(`   Regulatory History: ${dto.RegulatoryHistory.length}`);
    console.log('');

    // Save DTO to file for inspection
    const dtoPath = path.join(testOutputDir, 'test-dto.json');
    await fs.writeFile(dtoPath, JSON.stringify(dto, null, 2));
    console.log(`   DTO saved to: ${dtoPath}`);
    console.log('');

    // Step 4: Validate template
    console.log('Step 4: Validating template...');
    const templateExists = await validateTemplate('AuthorisedIndividual', '1.0');

    if (!templateExists) {
      console.warn('⚠️  Template not found');
      console.warn('   Create template at: src/templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx');
      console.warn('   See: src/templates/AuthorisedIndividual/README.md for guide');
      console.warn('');
      console.log('='.repeat(60));
      console.log('✅ PARTIAL TEST PASSED (Template creation required)');
      console.log('='.repeat(60));
      console.log('');
      console.log('Completed Steps:');
      console.log('  ✅ Dataverse connection');
      console.log('  ✅ Data fetching');
      console.log('  ✅ DTO mapping');
      console.log('  ⚠️  Template rendering (template file needed)');
      console.log('  ⏭️  PDF conversion (skipped)');
      console.log('  ⏭️  Storage (skipped)');
      console.log('');
      return;
    }

    console.log('✅ Template found');
    console.log('');

    // Step 5: Generate DOCX
    console.log('Step 5: Generating DOCX from template...');
    const docxBuffer = await generateDocx({
      documentType: 'AuthorisedIndividual',
      templateVersion: '1.0',
      data: dto as unknown as Record<string, unknown>
    });
    console.log(`✅ DOCX generated (${docxBuffer.length} bytes)`);

    // Save DOCX to file
    const docxPath = path.join(testOutputDir, `test-${testId}.docx`);
    await fs.writeFile(docxPath, docxBuffer);
    console.log(`   DOCX saved to: ${docxPath}`);
    console.log('');

    // Step 6: Convert to PDF (if configured)
    const pdfEngine = process.env.PDF_CONVERSION_ENGINE;
    if (!pdfEngine) {
      console.warn('⚠️  PDF conversion not configured');
      console.warn('   Set PDF_CONVERSION_ENGINE=graph or PDF_CONVERSION_ENGINE=libreoffice');
      console.warn('');
      console.log('='.repeat(60));
      console.log('✅ PARTIAL TEST PASSED (PDF conversion not configured)');
      console.log('='.repeat(60));
      console.log('');
      console.log('Completed Steps:');
      console.log('  ✅ Dataverse connection');
      console.log('  ✅ Data fetching');
      console.log('  ✅ DTO mapping');
      console.log('  ✅ Template rendering');
      console.log('  ⚠️  PDF conversion (not configured)');
      console.log('  ⏭️  Storage (skipped)');
      console.log('');
      return;
    }

    console.log(`Step 6: Converting to PDF using ${pdfEngine}...`);
    try {
      const pdfBuffer = await convertToPdf(docxBuffer, {
        documentType: 'AuthorisedIndividual',
        templateVersion: '1.0'
      });
      console.log(`✅ PDF converted (${pdfBuffer.length} bytes)`);

      // Save PDF to file
      const pdfPath = path.join(testOutputDir, `test-${testId}.pdf`);
      await fs.writeFile(pdfPath, pdfBuffer);
      console.log(`   PDF saved to: ${pdfPath}`);
      console.log('');

      // Step 7: Store PDF (if configured)
      const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!storageConnectionString) {
        console.warn('⚠️  Blob storage not configured (PDF not uploaded)');
        console.warn('   Set AZURE_STORAGE_CONNECTION_STRING to enable storage');
        console.warn('');
      } else {
        console.log('Step 7: Storing PDF in blob storage...');
        const pdfUrl = await storePdf({
          applicationId: testId,
          documentType: 'AuthorisedIndividual',
          templateVersion: '1.0',
          pdfBuffer
        });
        console.log(`✅ PDF stored`);
        console.log(`   URL: ${pdfUrl}`);
        console.log('');
      }

      console.log('='.repeat(60));
      console.log('✅ FULL PDF GENERATION TEST PASSED');
      console.log('='.repeat(60));
      console.log('');
      console.log('All Steps Completed:');
      console.log('  ✅ Dataverse connection');
      console.log('  ✅ Data fetching');
      console.log('  ✅ DTO mapping');
      console.log('  ✅ Template rendering');
      console.log('  ✅ PDF conversion');
      console.log(storageConnectionString ? '  ✅ Storage' : '  ⚠️  Storage (not configured)');
      console.log('');
      console.log('Test Output Files:');
      console.log(`  - ${dtoPath}`);
      console.log(`  - ${docxPath}`);
      console.log(`  - ${pdfPath}`);
      console.log('');

    } catch (conversionError) {
      console.error('❌ PDF conversion failed');
      console.error('Error:', conversionError instanceof Error ? conversionError.message : conversionError);
      console.error('');
      console.error('Troubleshooting:');
      if (pdfEngine === 'graph') {
        console.error('  - Check GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET');
        console.error('  - Ensure app has Microsoft Graph permissions');
        console.error('  - Verify OneDrive/SharePoint access');
      } else if (pdfEngine === 'libreoffice') {
        console.error('  - Ensure LibreOffice is installed');
        console.error('  - Check soffice command is in PATH');
      }
      console.error('');
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ PDF generation test failed');
    console.error('='.repeat(60));
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    process.exit(1);
  }
}

// Run test
testPdfGeneration();
